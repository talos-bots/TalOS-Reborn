import llamaTokenizer from '../helpers/llama-tokenizer-modified.js';
import { fetchCharacterById } from './characters.js';
import { SettingsInterfaceToMancerSettings, fetchConnectionById } from './connections.js';
import { fetchAllAppSettings, fetchSettingById } from './settings.js';
import express from 'express';
import { authenticateToken } from './authenticate-token.js';
import axios from 'axios';
import { DefaultSettings } from '../defaults/settings.js';
import { AppSettingsInterface, CharacterInterface, CompletionRequest, GenericCompletionConnectionTemplate, InstructMode, OpenAIMessage, OpenAIRole, SettingsInterface, UserPersona } from '../typings/types.js';
import { ChatMessage } from '../typings/discordBot.js';
export const llmsRouter = express.Router();

function getTokens(text: string){
    //@ts-expect-error - llamaTokenizer works fine
    return llamaTokenizer.encode(text).length;
}

function messagesToOpenAIChat(messages: ChatMessage[]){
    const formattedMessages: OpenAIMessage[] = [];
    messages.map((message: ChatMessage) => {
        const newMessage: OpenAIMessage = {
            'content': `${message.fallbackName}: ${message.swipes[message.currentIndex]}`,
            'role': (message.role as string).toLowerCase() as OpenAIRole
        }
        formattedMessages.push(newMessage)
    })
    return formattedMessages
}

function getInstructTokens(message: ChatMessage, instructFormat: InstructMode){
    const messageText = message.swipes[message.currentIndex].trim();
    let rolePrefix = "";
    switch(instructFormat){
        case "Alpaca":
            if(message.role === "System"){
                return getTokens(`### Instruction:\n${message.swipes[message.currentIndex]}`);
            }else if(message.thought === true){
                return getTokens(`### Response:\n${message.fallbackName}'s Thoughts: ${message.swipes[message.currentIndex]}`);
            }else if(message.role === "User"){
                return getTokens(`### Instruction:\n${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }else if(message.role === "Assistant"){
                return getTokens(`### Response:\n${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }
            return getTokens(`### Instruction:\n${message.swipes[message.currentIndex]}`);
        case "Mistral":
            if (message.role === "System") {
                rolePrefix = "System: ";
            } else if (message.thought === true) {
                rolePrefix = `${message.fallbackName}'s Thoughts: `;
            } else if (message.role === "User") {
                rolePrefix = `${message.fallbackName}: `;
            } else if(message.role === "Assistant") {
                return getTokens(`${messageText}\n`);
            }
            return getTokens(`[INST] ${rolePrefix}${messageText} [/INST]\n`);                   
        case "Vicuna":
            if(message.role === "System"){
                return getTokens(`SYSTEM: ${message.swipes[message.currentIndex]}`);
            }
            else if(message.thought === true){
                return getTokens(`ASSISTANT: ${message.fallbackName}'s Thoughts: ${message.swipes[message.currentIndex]}`);
            }
            else if(message.role === "User"){
                return getTokens(`USER: ${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }
            else if(message.role === "Assistant"){
                return getTokens(`ASSISTANT: ${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }
            return getTokens(`SYSTEM: ${message.swipes[message.currentIndex]}`);
        case "Metharme":
            if(message.role === "System"){
                return getTokens(`<|user|>${message.swipes[message.currentIndex]}`);
            }
            else if(message.thought === true){
                return getTokens(`<|model|>${message.fallbackName}'s Thoughts: ${message.swipes[message.currentIndex]}`);
            }
            else if(message.role === "User"){
                return getTokens(`<|user|>${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }
            else if(message.role === "Assistant"){
                return getTokens(`<|model|>${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }
            return getTokens(`<|user|>${message.swipes[message.currentIndex]}`);
        case "Pygmalion":
            if(message.role === "System"){
                return getTokens(`${message.swipes[message.currentIndex]}`);
            }
            else if(message.thought === true){
                if(message.role === "User"){
                    return getTokens(`You: ${message.fallbackName}'s Thoughts: ${message.swipes[message.currentIndex]}`);
                }else{
                    return getTokens(`<BOT>: ${message.fallbackName}'s Thoughts: ${message.swipes[message.currentIndex]}`);
                }
            }
            else if(message.role === "User"){
                return getTokens(`You: ${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }
            else if(message.role === "Assistant"){
                return getTokens(`<BOT>: ${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }
            return getTokens(`${message.swipes[message.currentIndex]}`);
        default:
            if(message.role === "System"){
                return getTokens(message.swipes[message.currentIndex]);
            }
            else if(message.thought === true){
                return getTokens(`${message.fallbackName}'s Thoughts: ${message.swipes[message.currentIndex]}`);
            }
            else if(message.role === "User"){
                return getTokens(`${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }
            else if(message.role === "Assistant"){
                return getTokens(`${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
            }
            return getTokens(message.swipes[message.currentIndex]);
    }
}

function fillChatContextToLimit(chatLog: ChatMessage[], tokenLimit: number, instructFormat: InstructMode = "None"){
    const messagesToInclude: ChatMessage[] = [];
    let tokenCount = 0;
    for(let i = chatLog.length - 1; i >= 0; i--){
        const message = chatLog[i];
        const tokens: number = getInstructTokens(message, instructFormat);
        if(tokens + tokenCount <= tokenLimit){
            messagesToInclude.unshift(message);
            tokenCount += tokens;
        } else {
            break;
        }
    }
    return messagesToInclude;
}

function assemblePromptFromLog(messages: ChatMessage[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string[] = [], persona?: UserPersona | null){
	let prompt = "";
	const newMessages = fillChatContextToLimit(messages, contextLength, "None");
	for(let i = 0; i < newMessages.length; i++){
        const messageText = newMessages[i].swipes[messages[i].currentIndex].trim();
		if(newMessages[i].role === 'System'){
			prompt += `${messageText}\n`;
			continue;
		}else{
			if(newMessages[i].thought === true){
                prompt += `${newMessages[i].fallbackName}'s Thoughts: ${messageText}\n`;
            }else{
                prompt += `${newMessages[i].fallbackName}: ${messageText}\n`;
            }
		}
	}
    // insert system prompt at the 4th line from the end
    if(newMessages.length > 0){
        const lines = prompt.split("\n");
        if(system_prompt.length > 0){
            lines.splice(lines.length - 3, 0, ...system_prompt);
        }
        if(persona){
            if((persona?.description) && (persona?.description.trim() !== "") && (persona?.importance === 'high')){
                lines.splice(lines.length - 4, 0,`[${persona.description.trim()}]\n`);
            }
        }
        prompt = lines.join("\n");
    }
    // If the last message was not from the bot, we append an empty response for the bot
    if (newMessages.length > 0) {
        prompt += `${constructName}:`;
    }
	return prompt;
}

function assembleAlpacaPromptFromLog(messages: ChatMessage[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string[] = [], persona?: UserPersona | null){
    let prompt = "";
    const newMessages = fillChatContextToLimit(messages, contextLength, "Alpaca");
    for(let i = 0; i < newMessages.length; i++){
        const messageText = newMessages[i].swipes[newMessages[i].currentIndex].trim();

        if(newMessages[i].role === 'System'){
            prompt += `### Instruction:\n${messageText}\n`;
            continue;
        } else if (newMessages[i].thought === true) {
			prompt += `### Response:\n${newMessages[i].fallbackName}'s Thoughts: ${messageText}\n`;
        } else {
            if (newMessages[i].role === 'User') {
                prompt += `### Instruction:\n${newMessages[i].fallbackName}: ${messageText}\n`;
            } else {
                prompt += `### Response:\n${newMessages[i].fallbackName}: ${messageText}\n`;
            }
        }
        // ?? idk if im doing this right, feel kinda dumb, TODO: fix this
        if(i === newMessages.length - 3 && system_prompt.length > 0){
            for(let j = 0; j < system_prompt.length; j++){
                prompt += `${system_prompt[j]}\n`;
            }
        }
        if(i === newMessages.length - 3 && persona){
            if((persona?.description) && (persona?.description.trim() !== "") && (persona?.importance === 'high')){
                prompt += `[${persona.description.trim()}]\n`;
            }
        }
    }
    // If the last message was not from the bot, we append an empty response for the bot
    if (newMessages.length > 0) {
        prompt += `### Response:\n${constructName}:`;
    }

    return prompt;
}

function assembleMistralPromptFromLog(messages: ChatMessage[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string[] = [], persona?: UserPersona | null) {
    let prompt = "";

    let systemInfo = system_prompt.map(prompt => prompt.trim()).join("\n");
    if(persona && persona.description.trim() !== "" && persona.importance === 'high') {
        systemInfo += `\n${persona.description.trim()}`;
    }
    if(systemInfo !== "") {
        prompt += `[INST]\n${systemInfo}\n[/INST]\n\n`;
    }

    const newMessages = fillChatContextToLimit(messages, contextLength, "Mistral");

    for (let i = 0; i < newMessages.length; i++) {
        const messageText = newMessages[i].swipes[newMessages[i].currentIndex].trim();

        if(newMessages[i].role === 'User') {
            prompt += `[INST] ${newMessages[i].fallbackName}: ${messageText} [/INST]\n`;
        } else if(newMessages[i].role === 'Assistant') {
            prompt += `${constructName}: ${messageText}\n`;
        }
    }

    // Append constructName for the AI to continue from there
    prompt += `${constructName}:\n`;

    return prompt;
}

function assembleVicunaPromptFromLog(messages: ChatMessage[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string[] = [], persona?: UserPersona | null){
    let prompt = "";
    const newMessages = fillChatContextToLimit(messages, contextLength, "Vicuna");
    for(let i = 0; i < newMessages.length; i++){
        const messageText = newMessages[i].swipes[newMessages[i].currentIndex].trim();

        if(newMessages[i].role === 'System'){
            prompt += `SYSTEM: ${messageText}\n`;
            continue;
        } else if (newMessages[i].thought === true) {
			prompt += `ASSISTANT: ${newMessages[i].fallbackName}'s Thoughts: ${messageText}\n`;
        } else {
            if (newMessages[i].role === 'User') {
                prompt += `USER: ${newMessages[i].fallbackName}: ${messageText}\n`;
            } else {
                prompt += `ASSISTANT: ${newMessages[i].fallbackName}: ${messageText}\n`;
            }
        }
    }
    // insert system prompt at the 4th line from the end
    if(newMessages.length > 0){
        const lines = prompt.split("\n");
        if(system_prompt.length > 0){
            lines.splice(lines.length - 3, 0, ...system_prompt);
        }
        if(persona){
            if((persona?.description) && (persona?.description.trim() !== "") && (persona?.importance === 'high')){
                lines.splice(lines.length - 4, 0,`[${persona.description.trim()}]\n`);
            }
        }
        prompt = lines.join("\n");
    }
    // If the last message was not from the bot, we append an empty response for the bot
    if (newMessages.length > 0) {
        prompt += `ASSISTANT: ${constructName}:`;
    }

    return prompt;
}

function assembleMetharmePromptFromLog(messages: ChatMessage[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string[] = [], persona?: UserPersona | null){
    let prompt = "";
    const newMessages = fillChatContextToLimit(messages, contextLength, "Metharme");
    for(let i = 0; i < newMessages.length; i++){
        const messageText = newMessages[i].swipes[newMessages[i].currentIndex].trim();

        if(newMessages[i].role === 'System'){
            prompt += `<|system|>${messageText}`;
            continue;
        } else if (newMessages[i].thought === true) {
			prompt += `<|model|>${newMessages[i].fallbackName}'s Thoughts: ${messageText}`;
        } else {
            if (newMessages[i].role === 'User') {
                prompt += `<|user|>${newMessages[i].fallbackName}: ${messageText}`;
            } else {
                prompt += `<|model|>${newMessages[i].fallbackName}: ${messageText}`;
            }
        }
        // ?? idk if im doing this right, feel kinda dumb, TODO: fix this
        if(i === newMessages.length - 3 && system_prompt.length > 0){
            prompt += `<|system|>${system_prompt.join(" ")}`;
        }
        if(i === newMessages.length - 3 && persona){
            if((persona?.description) && (persona?.description.trim() !== "") && (persona?.importance === 'high')){
                prompt += `<|system|>[${persona.description.trim()}]`;
            }
        }
    }
    // If the last message was not from the bot, we append an empty response for the bot
    if (newMessages.length > 0) {
        prompt += `<|model|>${constructName}:`;
    }
    return prompt;
}

function assemblePygmalionPromptFromLog(messages: ChatMessage[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string[] = [], persona?: UserPersona | null){
	let prompt = "";
	const newMessages = fillChatContextToLimit(messages, contextLength, "Pygmalion");
	for(let i = 0; i < newMessages.length; i++){
        const messageText = newMessages[i].swipes[messages[i].currentIndex].trim();
		if(newMessages[i].role === 'System'){
			prompt += `${messageText}\n`;
			continue;
		}else{
			if(newMessages[i].thought === true){
                if(newMessages[i].role === "User"){
                    prompt += `You: ${newMessages[i].fallbackName}'s Thoughts: ${messageText}\n`;
                }else{
                    prompt += `<BOT>: ${newMessages[i].fallbackName}'s Thoughts: ${messageText}\n`;
                }
            }else{
                if(newMessages[i].role === "User"){
                    prompt += `You: ${newMessages[i].fallbackName}: ${messageText}\n`;
                }else{
                    prompt += `<BOT>: ${newMessages[i].fallbackName}: ${messageText}\n`;
                }
            }
		}
	}
    // insert system prompt at the 4th line from the end
    if(newMessages.length > 0){
        const lines = prompt.split("\n");
        if(system_prompt.length > 0){
            lines.splice(lines.length - 3, 0, ...system_prompt);
        }
        if(persona){
            if((persona?.description) && (persona?.description.trim() !== "") && (persona?.importance === 'high')){
                lines.splice(lines.length - 4, 0,`[${persona.description.trim()}]\n`);
            }
        }
        prompt = lines.join("\n");
    }
    // If the last message was not from the bot, we append an empty response for the bot
    if (newMessages.length > 0) {
        prompt += `<BOT>: ${constructName}:`;
    }
	return prompt;
}

export function getCharacterPromptFromConstruct(character: CharacterInterface) {
    let prompt = '';

    if(character.description.trim().length > 0){
        prompt += character.description + '\n';
    }
    if(character.personality.trim().length > 0){
        prompt += character.personality + '\n';
    }
    if(character.mes_example.trim().length > 0){
        prompt += character.mes_example + '\n';
    }
    if(character.scenario.trim().length > 0){
        prompt += character.scenario + '\n\n';
    }
    return prompt;
}

async function formatCompletionRequest(request: CompletionRequest) {
    let character: CharacterInterface;
    if(typeof request.character === "string") {
        character = await fetchCharacterById(request.character) as CharacterInterface;
    }else{
        character = request.character;
    }
    let prompt = "";
    const data = getSettingsAndStops(request);
    if(!data){
        return null;
    }
    const { settingsInfo } = data;
    // Handling character information for Mistral mode
    let characterPrompt = "";
    if(character && settingsInfo.instruct_mode === "Mistral") {
        characterPrompt = getCharacterPromptFromConstruct(character);
        if(characterPrompt.trim().length > 0) {
            prompt += `[INST] Write ${character.name}'s next reply in this fictional roleplay with ${request.persona?.name || "User"}.\n\n ${characterPrompt.trim()} [/INST]\n\n`;
        }
    } else if(character && settingsInfo.instruct_mode === "Pygmalion") {
        characterPrompt = getCharacterPromptFromConstruct(character);
        if(characterPrompt.trim().length > 0) {
            prompt += `${characterPrompt.trim()}\n`;
        }
    } else if(character && settingsInfo.instruct_mode === "Metharme") {
        characterPrompt = `<|system|> ${getCharacterPromptFromConstruct(character).replaceAll('\n', ' ')}`
        if(characterPrompt.trim().length > 0) {
            prompt += `${characterPrompt.trim()}`;
        }
    } else if(character && settingsInfo.instruct_mode === "Vicuna") {
        characterPrompt = getCharacterPromptFromConstruct(character);
        if(characterPrompt.trim().length > 0) {
            prompt += `SYSTEM: ${characterPrompt.trim()}\n`;
        }
    } else if(character && settingsInfo.instruct_mode === "Alpaca") {
        characterPrompt = getCharacterPromptFromConstruct(character);
        if(characterPrompt.trim().length > 0) {
            prompt += `### Instruction:\n${characterPrompt.trim()}\n`;
        }
    } else {
        characterPrompt = getCharacterPromptFromConstruct(character);
        if(characterPrompt.trim().length > 0) {
            prompt += `${characterPrompt.trim()}\n`;
        }
    }
    const systemPrompts: string[] = [];
    // handle floatingGuidance
    if(request.args?.floatingGuidance){
        if(request.args.floatingGuidance.trim().length > 0){
            switch(settingsInfo.instruct_mode){
                case "Alpaca":
                    systemPrompts.push(`### Instruction:\n${request.args.floatingGuidance.trim()}\n`);
                    break;
                case "Vicuna":
                    systemPrompts.push(`SYSTEM: ${request.args.floatingGuidance.trim()}\n`);
                    break;
                case "Mistral":
                    systemPrompts.push(`[INST]\n${request.args.floatingGuidance.trim()}\n[/INST]\n\n`);
                    break;
                case "Metharme":
                    systemPrompts.push(`<|system|>${request.args.floatingGuidance.trim()}`);
                    break;
                case "Pygmalion":
                    systemPrompts.push(`${request.args.floatingGuidance.trim()}\n`);
                    break;
                default:
                    systemPrompts.push(`${request.args.floatingGuidance.trim()}\n`);
                    break;
            }
        }
    }

    const characterPromptTokens = getTokens(prompt);
    if(request.persona && request.persona.description && request.persona.description.trim() !== "" && request.persona.importance === 'low') {
        switch(settingsInfo.instruct_mode){
            case "Alpaca":
                prompt += `### Instruction:\n[${request.persona.description.trim()}]\n`;
                break;
            case "Vicuna":
                prompt += `SYSTEM: [${request.persona.description.trim()}]\n`;
                break;
            case "Mistral":
                prompt += `[INST]\n[${request.persona.description.trim()}]\n[/INST]\n\n`;
                break;
            case "Metharme":
                prompt += `<|system|>[${request.persona.description.trim()}]`;
                break;
            case "Pygmalion":
                prompt += `[${request.persona.description.trim()}]\n`;
                break;
            default:
                prompt += `[${request.persona.description.trim()}]\n`;
                break;
        }
    }

    const leftoverTokens = (settingsInfo.context_length - characterPromptTokens) - 800;
    if(character){
        if(character.system_prompt.trim().length > 0){
            systemPrompts.push(character.system_prompt.trim());
        }
    }
    // Assemble prompts based on instruct mode
    switch (settingsInfo.instruct_mode) {
        case "Alpaca":
            prompt += assembleAlpacaPromptFromLog(request.messages, leftoverTokens, character ? character.name : "Bot", systemPrompts, request.persona);
            break;
        case "Vicuna":
            prompt += assembleVicunaPromptFromLog(request.messages, leftoverTokens, character ? character.name : "Bot", systemPrompts, request.persona);
            break;
        case "Mistral":
            // For Mistral, character prompt is already included
            prompt += assembleMistralPromptFromLog(request.messages, leftoverTokens, character ? character.name : "Bot", [], request.persona);
            break;
        case "Metharme":
            prompt += assembleMetharmePromptFromLog(request.messages, leftoverTokens, character ? character.name : "Bot", systemPrompts, request.persona);
            break;
        case "Pygmalion":
            prompt += assemblePygmalionPromptFromLog(request.messages, leftoverTokens, character ? character.name : "Bot", systemPrompts, request.persona);
            break;
        default:
            prompt += assemblePromptFromLog(request.messages, leftoverTokens, character ? character.name : "Bot", systemPrompts, request.persona);
            break;
    }

    return prompt.replace(new RegExp('{{user}}', 'g'), `${request.persona?.name ?? 'You'}`).replace(new RegExp('{{char}}', 'g'), `${character.name}`).replace(new RegExp('<USER>', 'g'), `${request.persona?.name ?? 'You'}`).replace(new RegExp('<user>', 'g'), `${request.persona?.name ?? 'You'}`).replace(new RegExp('<char>', 'g'), `${character.name}`).replace(new RegExp('<CHAR>', 'g'), `${character.name}`);
}

function getSettingsAndStops(request: CompletionRequest): {settingsInfo: SettingsInterface, stopSequences: string[], modelInfo: GenericCompletionConnectionTemplate } | null{
    const stopSequences: string[] = [];
    const appSettings = fetchAllAppSettings();
    let connectionid = request.connectionid;
    if(!connectionid){
        connectionid = appSettings?.defaultConnection ?? "";
    }
    if(!connectionid){
        return null;
    }
    const modelInfo = fetchConnectionById(connectionid) as GenericCompletionConnectionTemplate;
    if(!modelInfo){
        return null;
    }
    let settingsid = request.settingsid;
    if(!settingsid){
        settingsid = appSettings?.defaultSettings ?? "1";
    }
    if(!settingsid) return null;
    if(settingsid?.length < 1){
        settingsid = "1";
    }
    let settingsInfo = fetchSettingById(settingsid) as SettingsInterface;
    if(!settingsInfo){
        settingsInfo = DefaultSettings[0];
    }
    if((settingsInfo.instruct_mode === 'Alpaca') || modelInfo.model?.includes("weaver-alpha") || modelInfo.model?.includes("mythomax")){
        stopSequences.push("###");
    }
    if((settingsInfo.instruct_mode === 'Vicuna') || modelInfo.model?.includes("goliath-120b")){
        stopSequences.push("USER:");
        stopSequences.push("ASSISTANT:");
    }
    if(modelInfo.model?.includes("mythalion") || (settingsInfo.instruct_mode === 'Metharme')){
        stopSequences.push("<|user|>");
        stopSequences.push("<|model|>");
    }
    if(settingsInfo.instruct_mode === "Alpaca"){
        stopSequences.push("###");
    }
    if(settingsInfo.instruct_mode === "Vicuna"){
        stopSequences.push("USER:");
        stopSequences.push("ASSISTANT:");
    }
    if(settingsInfo.instruct_mode === "Metharme"){
        stopSequences.push("<|user|>");
        stopSequences.push("<|model|>");
    }
    if(settingsInfo.instruct_mode === "Pygmalion"){
        stopSequences.push("You:");
        stopSequences.push("<BOT>:");
    }
    return { settingsInfo: settingsInfo, stopSequences: stopSequences, modelInfo: modelInfo };
}

function getStopSequences(messages: ChatMessage[]){
    const stopSequences: string[] = [];
    for(let i = 0; i < messages.length; i++){
        const message = messages[i];
        if(stopSequences.includes(`${message.fallbackName}:`) || message.role === "System" || message.thought === true || message.role === "Assistant"){
            continue;
        } else {
            stopSequences.push(`${message.fallbackName}:`);
        }
    }
    return stopSequences;
}

async function getMancerCompletion(request: CompletionRequest){
    const prompt = await formatCompletionRequest(request);
    const data = getSettingsAndStops(request);
    if(!data){
        return null;
    }
    const { settingsInfo, stopSequences, modelInfo } = data;
    stopSequences.push(...getStopSequences(request.messages));
    const settingsProper = SettingsInterfaceToMancerSettings(settingsInfo);
    let model = modelInfo.model;
    if(request.args?.modelOverride){
        if(request.args.modelOverride.trim().length > 0){
            model = request.args.modelOverride.trim();
        }
    }
    const body = {
        'model': model,
        'prompt': prompt,
        'stop': stopSequences,
        ...settingsProper,
    }
    console.log(body);
    try {
        const response = await fetch(`https://neuro.mancer.tech/oai/v1/completions`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${modelInfo.key?.trim()}`,
            },
        });
        const json = await response.json();
        return json;
    } catch (error) {
        console.error('Error in getMancerCompletion:', error);
        return null;
    }
}

llmsRouter.post('/completions/mancer', authenticateToken, async (req, res) => {
    const request = req.body as CompletionRequest;
    const response = await getMancerCompletion(request);
    res.send(response);
});

async function getGenericCompletion(request: CompletionRequest){
    const prompt = await formatCompletionRequest(request);
    const data = getSettingsAndStops(request);
    if(!data){
        return null;
    }
    const { settingsInfo, stopSequences, modelInfo } = data;
    stopSequences.push(...getStopSequences(request.messages));
    let model = modelInfo.model;
    if(request.args?.modelOverride){
        if(request.args.modelOverride.trim().length > 0){
            model = request.args.modelOverride.trim();
        }
    }
    const body = {
        'model': model,
        'prompt': prompt,
        'stop': stopSequences,
        'stream': false,
        ...settingsInfo
    }
    try {
        const newURL = new URL(modelInfo.url as string);
        const response = await fetch(`${newURL.protocol}//${newURL.hostname}${newURL.port? `:${newURL.port}` : ''}` + '/v1/completions', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${modelInfo.key? modelInfo.key.length > 0? `${modelInfo.key.trim()}` : '' : ''}`,
                'x-api-key': (modelInfo.key? modelInfo.key.length > 0? `${modelInfo.key.trim()}` : '' : ''),
            },
        });
        const json = await response.json();
        return json;
    } catch (error) {
        console.error('Error in getGenericCompletion:', error);
        return null;
    }
}

async function getGoogleCompletion(request: CompletionRequest){
    const appSettings = fetchAllAppSettings();
    console.log(appSettings);
    let connectionid = request.connectionid;
    if(!connectionid){
        connectionid = appSettings?.defaultConnection ?? "";
    }
    if(!connectionid){
        return null;
    }
    const modelInfo = fetchConnectionById(connectionid) as GenericCompletionConnectionTemplate;
    if(!modelInfo){
        return null;
    }
    switch(modelInfo.model){
        case 'models/text-bison-001':
            return await getPaLMCompletion(request);
        default:
            return await getGeminiCompletion(request);
    }
}

async function getPaLMCompletion(request: CompletionRequest){
    const prompt = await formatCompletionRequest(request);
    if(!prompt){
        return null;
    }
    const data = getSettingsAndStops(request);
    if(!data){
        return null;
    }
    const { settingsInfo, stopSequences, modelInfo } = data;
    stopSequences.push(...getStopSequences(request.messages));
    const PaLM_Payload = {
        "prompt": {
            text: `${prompt.toString()}`,
        },
        "safetySettings": [
            {
                "category": "HARM_CATEGORY_UNSPECIFIED",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DEROGATORY",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_TOXICITY",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_VIOLENCE",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_SEXUAL",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_MEDICAL",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS",
                "threshold": "BLOCK_NONE"
            }
        ],
        "temperature": (settingsInfo?.temperature !== undefined && settingsInfo.temperature <= 1) ? settingsInfo.temperature : 1,
        "candidateCount": 1,
        "maxOutputTokens": settingsInfo.max_tokens ? settingsInfo.max_tokens : 350,
        "topP": (settingsInfo.top_p !== undefined && settingsInfo.top_k <= 1) ? settingsInfo.top_p : 0.9,
        "topK": (settingsInfo.top_k !== undefined && settingsInfo.top_k >= 1) ? settingsInfo.top_k : 1,
    }
    console.log(PaLM_Payload);
    try {
        const response = await axios(`https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateText?key=${modelInfo.key?.trim()}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(PaLM_Payload),
            }
        ).then((response) => {
            return response;
        }).catch((error) => {
            return error.response;
        });
        if(!response){
            return null;
        }
        if (response.status !== 200) {
            console.error('Error generating completion:', response.statusText);
            return null;
        }
        const googleReply = await response.data;
        if (googleReply?.error) {
            throw new Error(googleReply.error.message);
        }else if (googleReply?.filters) {
            throw new Error('No valid response from LLM. Filters are blocking the response.');
        }else if (!googleReply?.candidates[0]?.output) {
            throw new Error('No valid response from LLM.');
        }else if (googleReply?.candidates[0]?.output?.length < 1) {
            throw new Error('No valid response from LLM.');
        }else if (googleReply?.candidates[0]?.output?.length > 1) {
            return {
                choices: [
                    {
                        text: googleReply?.candidates[0]?.output,
                        index: 0,
                        logprobs: null,
                        finish_reason: null,
                    }
                ]
            }
        }
    } catch (error) {
        console.error('Error in getPaLMCompletion:', error);
        return null;
    }
}

async function getGeminiCompletion(request: CompletionRequest){
    const prompt = await formatCompletionRequest(request);
    if(!prompt){
        return null;
    }
    const data = getSettingsAndStops(request);
    if(!data){
        return null;
    }
    const { settingsInfo, stopSequences, modelInfo } = data;
    stopSequences.push(...getStopSequences(request.messages));
    const PaLM_Payload = {
        "contents": [
            {
                "parts":[
                    {"text": `${prompt.toString()}`}
                ]
            }
        ],
        "safetySettings": [
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE"
            },
        ],
        "generationConfig": {
            "stopSequences": [
                "USER:",
                "ASSISTANT:",
                "###"
            ],
            "temperature": (settingsInfo?.temperature !== undefined && settingsInfo.temperature <= 1) ? settingsInfo.temperature : 1,
            "maxOutputTokens": settingsInfo.max_tokens ? settingsInfo.max_tokens : 350,
            "topP": (settingsInfo.top_p !== undefined && settingsInfo.top_k <= 1) ? settingsInfo.top_p : 0.9,
            "topK": (settingsInfo.top_k !== undefined && settingsInfo.top_k >= 1) ? settingsInfo.top_k : 1,
        }
    }
    console.log(PaLM_Payload);
    try {
        const response = await axios(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${modelInfo.key?.trim()}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(PaLM_Payload),
            },
        ).then((response) => {
            return response;
        }).catch((error) => {
            return error.response;
        });
        console.log(response.data);
        if(!response){
            return null;
        }
        if (response.status !== 200) {
            console.error('Error generating completion:', response.statusText);
            return null;
        }
        const googleReply = await response.data;
        if (googleReply?.error) {
            throw new Error(googleReply.data.error.message);
        }else if (googleReply?.filters) {
            throw new Error('No valid response from LLM. Filters are blocking the response.');
        }else if (!googleReply?.candidates[0]?.content?.parts[0]?.text) {
            throw new Error('No valid response from LLM.');
        }else if (googleReply?.candidates[0]?.content?.parts[0]?.text.length < 1) {
            throw new Error('No valid response from LLM.');
        }else if (googleReply?.candidates[0]?.content?.parts[0]?.text.length > 1) {
            return {
                choices: [
                    {
                        text: googleReply.candidates[0]?.content?.parts[0]?.text,
                        index: 0,
                        logprobs: null,
                        finish_reason: null,
                    }
                ]
            }
        }
    } catch (error) {
        console.error('Error in getGeminiCompletion:', error);
        return null;
    }
}

async function getOpenAICompletion(request: CompletionRequest){
    try {
        const messages = messagesToOpenAIChat(request.messages);
        const data = getSettingsAndStops(request);
        if(!data){
            return null;
        }
        const { settingsInfo, stopSequences, modelInfo } = data;
        stopSequences.push(...getStopSequences(request.messages));
        if(modelInfo.model === ''){
            throw new Error('No valid response from LLM.');
        }
        let model = modelInfo.model;
        if(request.args?.modelOverride){
            if(request.args.modelOverride.trim().length > 0){
                model = request.args.modelOverride.trim();
            }
        }
        const response = await axios('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${modelInfo.key?.trim()}`,
            },
            data: {
                "model": model,
                "messages": messages,
                "stop": stopSequences,
                "max_tokens": settingsInfo.max_tokens ? settingsInfo.max_tokens : 350,
                "temperature": (settingsInfo?.temperature !== undefined && settingsInfo.temperature <= 1) ? settingsInfo.temperature : 1,
                "top_p": (settingsInfo.top_p !== undefined && settingsInfo.top_k <= 1) ? settingsInfo.top_p : 0.9,
                "frequency_penalty": (settingsInfo.frequency_penalty !== undefined && settingsInfo.frequency_penalty <= 2) ? settingsInfo.frequency_penalty : 1,
                "presence_penalty": (settingsInfo.presence_penalty !== undefined && settingsInfo.presence_penalty <= 2) ? settingsInfo.presence_penalty : 1,
            },
        }).then((response) => {
            return response;
        }).catch((error) => {
            return error.response;
        });
        console.log(response.data);
        if(!response){
            return null;
        }
        if (response.status !== 200) {
            console.error('Error generating completion:', response.statusText);
            return null;
        }
        const openAIReply = await response.data;
        if (openAIReply?.error) {
            throw new Error(openAIReply.error.message);
        }
        const text = openAIReply?.choices[0]?.message.content.trim();
        if(!text){
            throw new Error('No valid response from LLM.');
        }
        return {
            choices: [
                {
                    text: text,
                    index: 0,
                    logprobs: openAIReply?.choices[0]?.logprobs,
                    finish_reason: openAIReply?.choices[0]?.finish_reason,
                }
            ]
        }
    } catch (error) {
        console.error('Error in getOpenAICompletion:', error);
        return null;
    }
}

export async function getOpenRouterCompletion(request: CompletionRequest){
    try {
        const prompt = await formatCompletionRequest(request);
        const data = getSettingsAndStops(request);
        if(!data){
            return null;
        }
        const { settingsInfo, stopSequences, modelInfo } = data;
        stopSequences.push(...getStopSequences(request.messages));
        let model = modelInfo.model;
        if(request.args?.modelOverride){
            if(request.args.modelOverride.trim().length > 0){
                model = request.args.modelOverride.trim();
            }
        }
        const body = {
            'model': model,
            'prompt': prompt,
            'stop': stopSequences,
            'stream': false,
            'temperature': (settingsInfo?.temperature !== undefined && settingsInfo.temperature <= 1) ? settingsInfo.temperature : 1,
            'max_tokens': settingsInfo.max_tokens ? settingsInfo.max_tokens : 350,
            'top_p': (settingsInfo.top_p !== undefined && settingsInfo.top_k <= 1) ? settingsInfo.top_p : 0.9,
            'top_k': (settingsInfo.top_k !== undefined && settingsInfo.top_k >= 1) ? settingsInfo.top_k : 1,
            'frequency_penalty': (settingsInfo.frequency_penalty !== undefined && settingsInfo.frequency_penalty <= 2) ? settingsInfo.frequency_penalty : 1,
            'presence_penalty': (settingsInfo.presence_penalty !== undefined && settingsInfo.presence_penalty <= 2) ? settingsInfo.presence_penalty : 1,
        }
        console.log(body);
        const response = await axios('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${modelInfo.key?.trim()}`,
            },
            data: body,
        }).then((response) => {
            return response;
        }).catch((error) => {
            return error.response;
        });
        console.log(response.data);
        if(!response){
            return null;
        }
        if (response.status !== 200) {
            console.error('Error generating completion:', response.statusText);
            return null;
        }
        const openAIReply = await response.data;
        if (openAIReply?.error) {
            throw new Error(openAIReply.error.message);
        }
        console.log(openAIReply);
        const text = openAIReply?.choices[0]?.text.trim();
        if(!text){
            throw new Error('No valid response from LLM.');
        }
        return {
            choices: [
                {
                    text: text,
                    index: 0,
                    logprobs: openAIReply?.choices[0]?.logprobs,
                    finish_reason: openAIReply?.choices[0]?.finish_reason,
                }
            ]
        }
    } catch (error) {
        console.error('Error in getOpenRouterCompletion:', error);
        return null;
    }
}

export async function getKoboldAICompletion(request: CompletionRequest){
    const prompt = await formatCompletionRequest(request);
    const data = getSettingsAndStops(request);
    if(!data){
        return null;
    }
    const { settingsInfo, stopSequences, modelInfo } = data;
    stopSequences.push(...getStopSequences(request.messages));
    const body = {
        'prompt': prompt,
        'stop_sequence': stopSequences,
        "max_context_length": settingsInfo.context_length ? settingsInfo.context_length : 1024,
        "max_length": settingsInfo.max_tokens ? settingsInfo.max_tokens : 350,
        "quiet": false,
        "rep_pen": settingsInfo.rep_pen ? settingsInfo.rep_pen : 1.2,
        "rep_pen_range": settingsInfo.rep_pen_range ? settingsInfo.rep_pen_range : 512,
        "rep_pen_slope": settingsInfo.rep_pen_slope ? settingsInfo.rep_pen_slope : 0.06,
        "temperature": settingsInfo.temperature ? settingsInfo.temperature : 0.9,
        "tfs": settingsInfo.tfs ? settingsInfo.tfs : 0.9,
        "top_a": settingsInfo.top_a ? settingsInfo.top_a : 0,
        "top_k": settingsInfo.top_k ? settingsInfo.top_k : 0,
        "top_p": settingsInfo.top_p ? settingsInfo.top_p : 0,
        "typical": settingsInfo.typical ? settingsInfo.typical : 0.9,
        "sampler_order": settingsInfo.sampler_order ? settingsInfo.sampler_order : [
            6,
            5,
            0,
            2,
            3,
            1,
            4
        ],

    }
    console.log(body);
    try {
        const newURL = new URL(modelInfo.url as string);
        const response = await fetch(`${newURL.protocol}//${newURL.hostname}${newURL.port? `:${newURL.port}` : ''}` + '/api/v1/generate', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${modelInfo.key? modelInfo.key.length > 0? `${modelInfo.key.trim()}` : '' : ''}`,
                'x-api-key': (modelInfo.key? modelInfo.key.length > 0? `${modelInfo.key.trim()}` : '' : ''),
            },
        });
        if(response.ok){
            const json = await response.json();

            return {
                choices: [
                    {
                        text: json.results[0].text,
                        index: 0,
                        logprobs: null,
                        finish_reason: 'stop',
                    }
                ]
            }
        }else{
            throw new Error('No valid response from LLM.');
        }
    } catch (error) {
        console.error('Error in getGenericCompletion:', error);
        return null;
    }
}

export async function handleCompletionRequest(request: CompletionRequest){
    const appSettings = fetchAllAppSettings();
    console.log(appSettings);
    let connectionid = request.connectionid;
    if(!connectionid){
        connectionid = appSettings?.defaultConnection ?? "";
    }
    if(!connectionid){
        return null;
    }
    const modelInfo = fetchConnectionById(connectionid) as GenericCompletionConnectionTemplate;
    if(!modelInfo){
        return null;
    }
    switch(modelInfo.type){
        case 'Mancer':
            return await getMancerCompletion(request);
        case 'PaLM':
            return await getGoogleCompletion(request);
        case 'OAI':
            return await getOpenAICompletion(request);
        case 'OpenRouter':
            return await getOpenRouterCompletion(request);
        case 'Kobold':
            return await getKoboldAICompletion(request);
        default:
            return await getGenericCompletion(request);
    }
}

llmsRouter.post('/completions', authenticateToken, async (req, res) => {
    const request = req.body as CompletionRequest;
    const response = await handleCompletionRequest(request);
    res.send(response);
});