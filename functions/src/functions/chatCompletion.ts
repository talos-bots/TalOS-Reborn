import { CompletionRequest, InstructMode, Message, UserPersona } from "../data-classes/CompletionRequest.js";
import { Character, getCharacter, getCharacterPromptFromConstruct } from "../data-classes/Character.js";
import llamaTokenizer from "../helpers.js/llama-tokenizer-modified.js";

export const chatCompletion = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        // Ensure it's a POST request
        if (request.method !== "POST") {
            return response.status(405).send("Method Not Allowed");
        }
        if (!request.body.data) {
            return response.status(400).send("Bad Request");
        }
        let data = request.body.data;
        if(!data.model){
            return response.status(400).send("Bad Request");
        }
        if(data.model === 'goliath-120b' || data.model === 'synthia-70b'){
            data.model = 'mythomanx';
        }
        if(!data.messages){
            return response.status(400).send("Bad Request");
        }
        if(!data.character){
            return response.status(400).send("Bad Request");
        }
        if(!data.character.name){
            return response.status(400).send("Bad Request");
        }
        try {
            const decodedIdToken = await admin.auth().verifyIdToken(idToken);
            console.log("ID Token correctly decoded", decodedIdToken);
        } catch (error) {
            console.error("Error while verifying Firebase ID token:", error);
            return response.status(403).send("Unauthorized");
        }
        console.log(request.body);
        getCompletion(data).then((completion) => {
            response.status(200).send({
                data: {
                    completion,
                },
            });
        }).catch((error) => {
            console.error(error);
            response.status(500).send(`Error: ${error}`,);
        });
    });
});

const storyWriter = {
    "max_tokens": 300,
    "min_tokens": 10,
    "stream": false,
    "temperature": 0.93,
    "top_p": 0.73,
    "top_k": 0,
    "top_a": 0,
    "typical_p": 1,
    "tfs": 1,
    "repetition_penalty": 1.1,
    "ban_eos_token": false,
    "frequency_penalty": 0.5,
    "presence_penalty": 0,
    "mirostat_mode": 2,
    "mirostat_tau": 5,
    "mirostat_eta": 0.01,
};

function determineModel(model: string){
    switch(model){
        case "weaver-alpha":
            return {
                'instruct': 'Alpaca',
                'token_limit': 8000,
            }
        case "synthia-70b":
            return {
                'instruct': 'Vicuna',
                'token_limit': 8192,
            }
        case "mythomax":
            return {
                'instruct': 'Alpaca',
                'token_limit': 8192,
            }
        case "goliath-120b":
            return {
                'instruct': 'Vicuna',
                'token_limit': 6144,
            }
        case "mythalion":
            return {
                'instruct': 'Metharme',
                'token_limit': 8192,
            }
        case "mytholite":
            return {
                'instruct': 'Alpaca',
                'token_limit': 2560,
            }
        default:
            return {
                'instruct': 'None',
                'token_limit': 4096,
            }
    }
}

function getTokens(text: string){
    return llamaTokenizer.encode(text).length;
}

function getInstructTokens(message: Message, instructFormat: InstructMode){
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

function fillChatContextToLimit(chatLog: Message[], tokenLimit: number, instructFormat: InstructMode = "None"){
    const messagesToInclude: Message[] = [];
    let tokenCount = 0;
    for(let i = chatLog.length - 1; i >= 0; i--){
        const message = chatLog[i];
        let tokens: number = getInstructTokens(message, instructFormat);
        if(tokens+ tokenCount <= tokenLimit){
            messagesToInclude.unshift(message);
            tokenCount += tokens;
        } else {
            break;
        }
    }
    return messagesToInclude;
}

function assemblePromptFromLog(messages: Message[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string = "", persona?: UserPersona | null){
	let prompt = "";
	let newMessages = fillChatContextToLimit(messages, contextLength, "None");
	for(let i = 0; i < newMessages.length; i++){
        let messageText = messages[i].swipes[messages[i].currentIndex].trim();
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
        if(system_prompt.trim() !== ""){
            lines.splice(lines.length - 3, 0, system_prompt);
        }
        if(persona){
            if((persona?.description) && (persona?.description.trim() !== "") && (persona?.importance === 'high')){
                lines.splice(lines.length - 4, 0,`[${persona.description.trim()}]`);
            }
        }
        prompt = lines.join("\n");
    }
    // If the last message was not from the bot, we append an empty response for the bot
    if (newMessages.length > 0 && newMessages[newMessages.length - 1].role !== "Assistant") {
        prompt += `${constructName}:`;
    }
	return prompt;
}

function assembleAlpacaPromptFromLog(messages: Message[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string = "", persona?: UserPersona | null){
    let prompt = "";
    let newMessages = fillChatContextToLimit(messages, contextLength, "Alpaca");
    for(let i = 0; i < newMessages.length; i++){
        let messageText = newMessages[i].swipes[newMessages[i].currentIndex].trim();

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
        if(i === newMessages.length - 3 && system_prompt !== ""){
            prompt += `${system_prompt}\n`;
        }
        if(i === newMessages.length - 3 && persona){
            if((persona?.description) && (persona?.description.trim() !== "") && (persona?.importance === 'high')){
                prompt += `[${persona.description.trim()}]`;
            }
        }
    }
    // If the last message was not from the bot, we append an empty response for the bot
    if (newMessages.length > 0 && newMessages[newMessages.length - 1].role !== "Assistant") {
        prompt += `### Response:\n${constructName}:`;
    }

    return prompt;
}

function assembleVicunaPromptFromLog(messages: Message[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string = "", persona?: UserPersona | null){
    let prompt = "";
    let newMessages = fillChatContextToLimit(messages, contextLength, "Vicuna");
    for(let i = 0; i < newMessages.length; i++){
        let messageText = newMessages[i].swipes[newMessages[i].currentIndex].trim();

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
        if(system_prompt.trim() !== ""){
            lines.splice(lines.length - 3, 0, system_prompt);
        }
        if(persona){
            if((persona?.description) && (persona?.description.trim() !== "") && (persona?.importance === 'high')){
                lines.splice(lines.length - 4, 0,`[${persona.description.trim()}]`);
            }
        }
        prompt = lines.join("\n");
    }
    // If the last message was not from the bot, we append an empty response for the bot
    if (newMessages.length > 0 && newMessages[newMessages.length - 1].role !== "Assistant") {
        prompt += `ASSISTANT: ${constructName}:`;
    }

    return prompt;
}

function assembleMetharmePromptFromLog(messages: Message[], contextLength: number = 4048, constructName: string = "Bot", system_prompt: string = "", persona?: UserPersona | null){
    let prompt = "";
    let newMessages = fillChatContextToLimit(messages, contextLength, "Metharme");
    for(let i = 0; i < newMessages.length; i++){
        let messageText = newMessages[i].swipes[newMessages[i].currentIndex].trim();

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
        if(i === newMessages.length - 3 && system_prompt !== ""){
            prompt += `<|system|>${system_prompt}`;
        }
        if(i === newMessages.length - 3 && persona){
            if((persona?.description) && (persona?.description.trim() !== "") && (persona?.importance === 'high')){
                prompt += `<|system|>[${persona.description.trim()}]`;
            }
        }
    }
    // If the last message was not from the bot, we append an empty response for the bot
    if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'User') {
        prompt += `<|model|>${constructName}:`;
    }
    return prompt;
}

async function formatCompletionRequest(request: CompletionRequest){
    let character: Character;
    if(typeof request.character === "string"){
        character = await getCharacter(request.character);
    }
    else{
        character = request.character;
    }
    let characterPrompt = "";
    if(character){
        characterPrompt = getCharacterPromptFromConstruct(character);
    }
    let prompt = characterPrompt;
    const characterPromptTokens = getTokens(characterPrompt);
    const modelInfo = determineModel(request.model);
    if((request?.persona) && (request?.persona?.description) && (request?.persona?.description.trim() !== "") && (request?.persona?.importance === 'low')){
        prompt += `[${request.persona.description.trim()}]`;
    }
    const leftoverTokens = modelInfo.token_limit - characterPromptTokens;
    if(modelInfo.instruct === "Alpaca"){
        prompt += assembleAlpacaPromptFromLog(request.messages, leftoverTokens , character ? character.name : "Bot", character ? character.system_prompt : "", request?.persona);
    }
    else if(modelInfo.instruct === "Vicuna"){
        prompt += assembleVicunaPromptFromLog(request.messages, leftoverTokens, character ? character.name : "Bot", character ? character.system_prompt : "", request?.persona);
    }
    else if(modelInfo.instruct === "Metharme"){
        prompt += assembleMetharmePromptFromLog(request.messages, leftoverTokens, character ? character.name : "Bot", character ? character.system_prompt : "", request?.persona);
    }
    else{
        prompt += assemblePromptFromLog(request.messages, leftoverTokens, character ? character.name : "Bot", character ? character.system_prompt : "", request?.persona);
    }
    return prompt.replace(new RegExp('{{user}}', 'g'), `${request?.persona?.name ?? 'You'}`).replace(new RegExp('{{char}}', 'g'), `${character.name}`);
}

function getStopSequences(messages: Message[]){
    const stopSequences: string[] = [];
    for(let i = 0; i < messages.length; i++){
        const message = messages[i];
        if(stopSequences.includes(message.fallbackName)){
            continue;
        }
        stopSequences.push(`${message.fallbackName}:`);
    }
    return stopSequences;
}

async function getCompletion(request: CompletionRequest){
    const prompt = await formatCompletionRequest(request);
    const stopSequences = getStopSequences(request.messages);
    if(request.model === "weaver-alpha" || request.model === "mythomax"){
        stopSequences.push("###");
    }
    if(request.model === "synthia-70b" || request.model === "goliath-120b"){
        stopSequences.push("USER:");
        stopSequences.push("ASSISTANT:");
    }
    if(request.model === "mythalion"){
        stopSequences.push("<|user|>");
        stopSequences.push("<|model|>");
    }
    const body = {
        'model': request.model,
        'prompt': prompt,
        'stop': stopSequences,
        ...storyWriter,
    }
    console.log(body);
    const response = await fetch(`https://neuro.mancer.tech/oai/v1/completions`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MANCER_KEY}`,
        },
    });
    const json = await response.json();
    return json;
}