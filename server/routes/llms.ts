/* eslint-disable no-control-regex */
import llamaTokenizer from '../helpers/llama-tokenizer-modified.js';
import { fetchCharacterById } from './characters.js';
import { SettingsInterfaceToMancerSettings, fetchConnectionById } from './connections.js';
import { fetchAllAppSettings, fetchSettingById } from './settings.js';
import express from 'express';
import { authenticateToken } from './authenticate-token.js';
import axios from 'axios';
import { DefaultSettings } from '../defaults/settings.js';
import { AppSettingsInterface, CharacterInterface, CompletionRequest, GenericCompletionConnectionTemplate, InstructMode, LoreEntryInterface, OpenAIMessage, OpenAIRole, Role, SettingsInterface, UserPersona } from '../typings/types.js';
import { ChatMessage } from '../typings/discordBot.js';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { decodeHTML } from 'entities';
const __dirname = resolve();
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
                return getTokens(`### Input:\n${message.fallbackName}: ${message.swipes[message.currentIndex]}`);
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
        case "ChatML":
            if(message.role === "System"){
                return getTokens(`<|im_start|>system\n${message.swipes[message.currentIndex]}\n`);
            }
            else if(message.thought === true){
                return getTokens(`<|im_start|>assistant\n${message.fallbackName}'s Thoughts: ${message.swipes[message.currentIndex]}\n`);
            }
            else if(message.role === "User"){
                return getTokens(`<|im_start|>user\n${message.fallbackName}: ${message.swipes[message.currentIndex]}\n`);
            }
            else if(message.role === "Assistant"){
                return getTokens(`<|im_start|>assistant\n${message.fallbackName}: ${message.swipes[message.currentIndex]}\n`);
            }
            return getTokens(`<|im_start|>system\n${message.swipes[message.currentIndex]}\n`);
        case "GemmaInstruct":
            if(message.role === "System"){
                return getTokens(`<start_of_turn>system\n${message.swipes[message.currentIndex]}\n`);
            }
            else if(message.thought === true){
                return getTokens(`<start_of_turn>model\n${message.fallbackName}'s Thoughts: ${message.swipes[message.currentIndex]}\n`);
            }
            else if(message.role === "User"){
                return getTokens(`<start_of_turn>user\n${message.fallbackName}: ${message.swipes[message.currentIndex]}\n`);
            }
            else if(message.role === "Assistant"){
                return getTokens(`<start_of_turn>model\n${message.fallbackName}: ${message.swipes[message.currentIndex]}\n`);
            }
            return getTokens(`<start_of_turn>system\n${message.swipes[message.currentIndex]}\n`);
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

export function getCharacterPromptFromConstruct(character: CharacterInterface) {
    let prompt = '';

    if(character.description?.trim().length > 0){
        prompt += character.description + '\n';
    }
    if(character.personality?.trim().length > 0){
        prompt += character.personality + '\n';
    }
    if(character.mes_example?.trim().length > 0){
        prompt += character.mes_example + '\n';
    }
    if(character.scenario?.trim().length > 0){
        prompt += character.scenario + '\n\n';
    }
    return prompt;
}

export function getSettingsAndStops(request: CompletionRequest): {settingsInfo: SettingsInterface, stopSequences: string[], modelInfo: GenericCompletionConnectionTemplate } | null{
    let stopSequences: string[] = [];
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
    if(settingsInfo.instruct_mode === "Mistral"){
        stopSequences.push("```");
        stopSequences.push("[INST]");
    }
    if(settingsInfo.instruct_mode === "ChatML"){
        stopSequences.push("<|im_start|>user");
        stopSequences.push("<|im_start|>assistant");
    }
    if(settingsInfo.instruct_mode === "GemmaInstruct"){
        stopSequences.push("<start_of_turn>user");
        stopSequences.push("<start_of_turn>model");
    }
    if(request.args?.overrideSettings){
        settingsInfo = {...settingsInfo, ...request.args.overrideSettings};
    }
    // get rid of duplicate stop sequences
    stopSequences = [...new Set(stopSequences)];
    // remove empty stop sequences
    stopSequences = stopSequences.filter((stop) => stop.trim().length > 0);
    return { settingsInfo: settingsInfo, stopSequences: stopSequences, modelInfo: modelInfo };
}

function getStopSequences(messages: ChatMessage[]){
    let stopSequences: string[] = [];
    for(let i = 0; i < messages.length; i++){
        const message = messages[i];
        if(stopSequences.includes(`${message.fallbackName}:`) || message.role === "System" || message.thought === true || message.role === "Assistant"){
            continue;
        } else {
            stopSequences.push(`${message.fallbackName}:`);
        }
    }
    //filter out empty stop sequences
    stopSequences = stopSequences.filter((stop) => stop.trim().length > 0);
    //filter out duplicate stop sequences
    stopSequences = [...new Set(stopSequences)];
    return stopSequences
}

async function getMancerCompletion(request: CompletionRequest){
    const promptData = await formatOldRequest(request);
    if(!promptData){
        return null;
    }
    const { prompt, stop } = promptData;
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
        'stop': stop,
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
    const promptData = await formatOldRequest(request);
    if(!promptData){
        return null;
    }
    const { prompt, stop } = promptData;
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
        'stop': stop,
        'stopping_strings': stop,
        'stream': false,
        'repetition_penality': settingsInfo.rep_pen,
        'repetition_penality_slope': settingsInfo.rep_pen_slope,
        'repetition_penality_range': settingsInfo.rep_pen_range,
        'token_repetition_penality': settingsInfo.rep_pen,
        'token_repetition_penality_slope': settingsInfo.rep_pen_slope,
        'token_repetition_penality_range': settingsInfo.rep_pen_range,
        'token_frequency_penalty': settingsInfo.frequency_penalty,
        'token_presence_penalty': settingsInfo.presence_penalty,
        'dynatemp_range': settingsInfo.dynatemp_max,
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
    const promptData = await formatOldRequest(request);
    if(!promptData){
        return null;
    }
    const { prompt, stop } = promptData;
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
    const promptData = await formatOldRequest(request);
    if(!promptData){
        return null;
    }
    const { prompt, stop } = promptData;
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
        const promptData = await formatOldRequest(request);
        if(!promptData){
            return null;
        }
        const { prompt, stop } = promptData;
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
            'stop': stop,
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
    const promptData = await formatOldRequest(request);
    if(!promptData){
        return null;
    }
    const { prompt, stop } = promptData;
    const data = getSettingsAndStops(request);
    if(!data){
        return null;
    }
    const { settingsInfo, stopSequences, modelInfo } = data;
    stopSequences.push(...getStopSequences(request.messages));
    const body = {
        'prompt': prompt,
        'stop_sequence': stop,
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

async function getClaudeCompletion(request: CompletionRequest){
    const promptData = await formatOldRequest(request);
    if(!promptData){
        return null;
    }
    const { prompt, stop } = promptData;
    let character: CharacterInterface;
    if(typeof request.character === "string") {
        character = await fetchCharacterById(request.character) as CharacterInterface;
    }else{
        character = request.character;
    }
    const promptString = `\n\nHuman:\nWrite ${character.name}'s next reply in a fictional chat between ${character.name} and ${request.persona?.name}. Write 1 reply only in internet RP style, italicize actions, and avoid quotation marks. Use markdown. Be proactive, creative, and drive the plot and conversation forward. Write at least 1 sentence, up to 4. Always stay in character and avoid repetition.\n${prompt}\n\nAssistant: Okay, here is my response as ${character.name}:`;
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
        'model': model ? model : 'claude-instant-v1',
        'prompt': promptString,
        'stop_sequences': stop,
        'stream': false,
        "temperature": settingsInfo.temperature ? settingsInfo.temperature : 0.9,
        "top_p": settingsInfo.top_p ? settingsInfo.top_p : 0.9,
        "top_k": settingsInfo.top_k ? settingsInfo.top_k : 0,
        "max_tokens_to_sample": settingsInfo.max_tokens ? settingsInfo.max_tokens : 350,
    }
    try {
        const newURL = new URL(modelInfo.url as string);
        const response = await fetch(`${newURL.protocol}//${newURL.hostname}${newURL.port? `:${newURL.port}` : ''}` + (modelInfo.type === 'P-AWS-Claude' ? '/proxy/aws/claude/v1/complete' : '/proxy/anthropic/v1/complete'), {
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
                        text: json.completion.trimStart(),
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
        case 'P-Claude':
        case 'P-AWS-Claude':
            return await getClaudeCompletion(request);
        default:
            return await getGenericCompletion(request);
    }
}

llmsRouter.post('/completions', authenticateToken, async (req, res) => {
    const request = req.body as CompletionRequest;
    const response = await handleCompletionRequest(request);
    res.send(response);
});

export async function formatOldRequest(request: CompletionRequest, alpacaLength?: string) {
    let character: CharacterInterface;
    if(typeof request.character === "string") {
        character = await fetchCharacterById(request.character) as CharacterInterface;
    } else {
        character = request.character;
    }
    let prompt: string = "";
    const data = getSettingsAndStops(request);
    if(!data){
        return null;
    }
    const { settingsInfo, stopSequences, modelInfo } = data;
    const characterPrompt = getCharacterPromptFromConstruct(character);
    const systemPrompts: string[] = [];
    // handle floatingGuidance
    if (request.args?.floatingGuidance) {
      if (request.args.floatingGuidance.trim().length > 0) {
        systemPrompts.push(`${request.args.floatingGuidance.trim()}\n`);
      }
    }
    const characterPromptTokens = getTokens(characterPrompt);
    const leftoverTokens = (settingsInfo?.context_length - characterPromptTokens - 800);
    if (character) {
      if (character?.system_prompt?.trim().length > 0) {
        systemPrompts.push(character.system_prompt.trim());
      }
    }
    // Assemble prompts based on instruct mode
    console.log("INSTRUCT MODE: " + settingsInfo.instruct_mode)
    const handleBarsPrompt = await assemblePrompt(
      character, 
      request.messages, 
      '',
      leftoverTokens,
      character ? character.name : "Bot",
      systemPrompts,
      settingsInfo.instruct_mode,
      request.persona,
      [],
    );
    prompt = handleBarsPrompt;
    prompt = prompt.toString()
    prompt = prompt
    .replace(new RegExp("{{user}}", "g"), `${request.persona?.name ?? "You"}`)
    .replace(new RegExp("{{char}}", "g"), `${character.name}`)
    .replace(new RegExp("<USER>", "g"), `${request.persona?.name ?? "You"}`)
    .replace(new RegExp("<user>", "g"), `${request.persona?.name ?? "You"}`)
    .replace(new RegExp("<char>", "g"), `${character.name}`)
    .replace(new RegExp("<CHAR>", "g"), `${character.name}`)
    .replace(new RegExp("\n\n", "g"), `\n`)
    .replace(new RegExp("\n\n\n", "g"), `\n`)
    .replace(new RegExp("\n\n\n\n", "g"), `\n`)
    .replace(new RegExp("\n \n", "g"), `\n`)
    .replace(new RegExp("\n \n \n", "g"), `\n`)
    .replace(new RegExp("\n \n \n \n", "g"), `\n`)
    .replace(new RegExp("\r", "g"), ``)
    return {
      prompt,
      stop: stopSequences,
    };
}

export const jailbreak =
`You are {{char}}, only respond as {{char}}. Responding out of context, or 'OOC', is forbidden, doing so will result in penalty. Replying as {{user}} will break immersion and is forbidden. NSFW content is allowed, but only in the context of the character, or as a response to user flirting or NSFW content.`;

export async function assemblePrompt(
    character: CharacterInterface,
    messages: ChatMessage[],
    loreBefore: string,
    contextLength: number,
    constructName: string,
    systemPrompt: string[],
    instruct?: InstructMode,
    persona?: UserPersona,
    lorebooks?: LoreEntryInterface[],
    alpacaLength?: string
  ) {
    interface MessageType {
      index: number;
      message: string;
      name: string;
      system: boolean;
      role: Role;
      loreentries: LoreEntryInterface[];
      showPersona: boolean;
    }
    const newMessages = fillChatContextToLimit(messages, contextLength, instruct);
    const sortedLoreEntries = lorebooks?.sort((a, b) => a.priority - b.priority);
    const systemInfo = systemPrompt.map((p) => p.trim()).join("\n");
    const allMessages: MessageType[] = [];
    const showPersonaAtTop = persona?.importance === "low";
    const personaDesc = persona?.description || "";
    for (let i = 0; i < newMessages.length; i++) {
      const msg = newMessages[i];
      const trimmedMessage = msg.swipes[msg.currentIndex].trim();
      const messageObj: MessageType = {
        index: i,
        message: trimmedMessage,
        name: msg.fallbackName || "",
        system: msg.role === 'System',
        loreentries: [],
        role: msg.role as Role,
        showPersona: persona?.importance === "high" && i === newMessages.length - 3 && personaDesc.trim() !== "",
      };
      if (sortedLoreEntries) {
        for (let j = 0; j < sortedLoreEntries.length; j++) {
          const depth = sortedLoreEntries[j].priority;
          const insertHere = (depth === 0 || depth > newMessages.length) ? newMessages.length : newMessages.length - depth;
          if (insertHere === i) {
            messageObj.loreentries.push(sortedLoreEntries[j]);
          }
        }
      }
      allMessages.push(messageObj);
    }
    const data = {
      allMessages,
      character: character,
      personaDesc: personaDesc.trim(),
      showPersonaAtTop,
      jailbreak: jailbreak.trim(),
      loreBefore: loreBefore.trim(),
      systemInfo: systemInfo.trim(),
      characterName: constructName,
      alpacaLength: alpacaLength || '(one paragraph, natural, authentic, descriptive, creative)',
    }
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      // @ts-expect-error - fuck off
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
    const templatePath = resolve(__dirname, 'templates', `${instruct}.hbs`);
    const template = readFileSync(templatePath, 'utf-8');
    const makePrompt = Handlebars.compile(template);
    const prompt = decodeHTML(makePrompt(data).replaceAll('\n\n', '\n').trim()).replaceAll('\n\n', '')
    return prompt;
  }