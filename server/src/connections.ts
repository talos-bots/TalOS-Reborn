/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import { connectionsPath } from './main.js';
import { CharacterInterface } from './characters.js';
dotenv.config();

export type Role = "System" | "Assistant" | "User";

export type InstructMode = "Alpaca" | "Vicuna" | "None" | "Metharme";

export class UserPersona{
    _id: string = (new Date().getTime()).toString();
    name: string = '';
    avatar: string = '';
    description: string = '';
    importance: 'high' | 'low' = 'high';

    constructor(name: string, avatar: string, description: string, importance: 'high' | 'low'){
        this.name = name;
        this.avatar = avatar;
        this.description = description;
        this.importance = importance;
    }

    toJSON(): any {
        return {
            _id: this._id,
            name: this.name,
            avatar: this.avatar,
            description: this.description,
            importance: this.importance,
        };
    }
}

export type Message = {
    userId: string;
    fallbackName: string;
    swipes: string[];
    currentIndex: number;
    role: Role;
    thought: boolean;
};

export type CompletionRequest = {
    lorebookid: string;
    connectionid: string | null;
    character: CharacterInterface | string;
    settingsid: string | null;
    messages: Message[];
    persona: UserPersona;
}

export type TokenType = 'SentencePiece' | 'GPT';

export type EndpointType = 'Kobold' | 'OAI' | 'Horde' | 'P-Claude' | 'P-AWS-Claude' | 'PaLM' | 'OAI-Compliant-API' | 'Mancer'

export type CompletionType = 'Chat' | 'Text';

export type GenericCompletionConnectionTemplate = {
    id: string;
    key?: string;
    url?: string;
    model?: string;
    name?: string;
    legacy?: boolean;
    type?: EndpointType;
}

export type SettingsInterface = {
    id: string;
    name: string;
    rep_pen: number;
    rep_pen_range: number;
    rep_pen_slope: number;
    temperature: number;
    sampler_order: number[];
    top_k: number;
    top_p: number;
    top_a: number;
    min_p: number;
    presence_penalty: number;
    frequency_penalty: number;
    tfs: number;
    typical: number;
    singleline: boolean;
    sampler_full_determinism: boolean;
    min_tokens: number;
    context_length: number;
    max_tokens: number;
    mirostat_mode: number;
    mirostat_tau: number;
    mirostat_eta: number;
    instruct_mode: InstructMode;
}

export type MancerSettingsInterface = {
    max_tokens: number;
    min_tokens: number;
    stream: boolean;
    temperature: number;
    top_p: number;
    top_k: number;
    top_a: number;
    typical_p: number;
    tff: number;
    repetition_penalty: number;
    ban_eos_token: boolean;
    frequency_penalty: number;
    presence_penalty: number;
    mirostat_mode: number;
    mirostat_tau: number;
    mirostat_eta: number;
}

export function SettingsInterfaceToMancerSettings(settings: SettingsInterface): MancerSettingsInterface {
    return {
        max_tokens: settings.max_tokens,
        min_tokens: settings.min_tokens,
        stream: false,
        temperature: settings.temperature,
        top_p: settings.top_p,
        top_k: settings.top_k,
        top_a: settings.top_a,
        typical_p: settings.typical,
        tff: settings.tfs,
        repetition_penalty: settings.rep_pen,
        ban_eos_token: false,
        frequency_penalty: settings.frequency_penalty,
        presence_penalty: settings.presence_penalty,
        mirostat_mode: settings.mirostat_mode,
        mirostat_tau: settings.mirostat_tau,
        mirostat_eta: settings.mirostat_eta,
    };
}

export const connectionsRouter = express.Router();

// get all connections from the ../data/connections/ folder
function fetchAllConnections() {
    const connectionFolderPath = path.join(connectionsPath);
    const connectionFiles = fs.readdirSync(connectionFolderPath);
    const connectionData = connectionFiles.map((file) => {
        if(!file.endsWith(".json")) return;
        const filePath = path.join(connectionFolderPath, file);
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    });
    return connectionData;
}

connectionsRouter.get('/connections', (req, res) => {
    const connectionData = fetchAllConnections();
    res.send(connectionData);
});

// save a connection to the ../data/connections/ folder
function saveConnection(connection: any) {
    const connectionFolderPath = path.join(connectionsPath);
    const filePath = path.join(connectionFolderPath, `${connection.id}.json`);
    const connectionJson = JSON.stringify(connection, null, 4); // Pretty print the JSON
    fs.writeFileSync(filePath, connectionJson, "utf-8");
}

connectionsRouter.post('/save/connection', (req, res) => {
    const connection = req.body;
    saveConnection(connection);
    res.send({ message: "Connection saved successfully!" });
});

// get a connection by id from the ../data/connections/ folder
export function fetchConnectionById(id: string) {
    const connectionFolderPath = path.join(connectionsPath);
    const filePath = path.join(connectionFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData) as GenericCompletionConnectionTemplate;
    } else {
        return null; // or handle the error as needed
    }
}

connectionsRouter.get('/connections/:id', (req, res) => {
    const id = req.params.id;
    const connection = fetchConnectionById(id);
    if (connection) {
        res.send(connection);
    } else {
        res.status(404).send({ message: "Connection not found" });
    }
});

//remove a connection by id from the ../data/connections/ folder
function removeConnectionById(id: string) {
    const connectionFolderPath = path.join(connectionsPath);
    const filePath = path.join(connectionFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    } else {
        return null; // or handle the error as needed
    }
}

connectionsRouter.delete('/connection/:id', (req, res) => {
    const id = req.params.id;
    removeConnectionById(id);
    res.send({ message: "Connection removed successfully!" });
});

async function fetchGenericConnectionModels(url: string, key?: string) {
    const endpointURLObject = new URL(url);
    const response = await fetch(`${endpointURLObject.protocol}//${endpointURLObject.hostname}${endpointURLObject.port? `:${endpointURLObject.port}` : ''}` + `/v1/models`,
    {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': (key? key.length > 0? `Bearer ${key}` : '' : '')
        }
    
    });
    console.log(response);
    if (!response.ok) {
        console.log('Connection models not found');
        throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json()
    console.log(data);
    return data;
}

connectionsRouter.post('/test/connections', async (req, res) => {
    const url = req.body.url;
    const key = req.body.key;
    const data = await fetchGenericConnectionModels(url as string, key as string);
    res.send({...data});
});

async function getMancerModels(key?: string) {
    const response = await fetch(`https://neuro.mancer.tech/oai/v1/models`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key?.trim()}`,
        },
    });
    const json = await response.json();
    return json;
}

connectionsRouter.post('/test/mancer', async (req, res) => {
    const request = req.body.key;
    const data = await getMancerModels(request);
    res.send({...data});
});

async function getPalmModels(key?: string){
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        console.log('Connection models not found');
        throw new Error(`Error: ${response.status}`);
    }
    const json = await response.json();
    return json;
}

connectionsRouter.post('/test/palm', async (req, res) => {
    const request = req.body.key;
    const data = await getPalmModels(request);
    res.send({...data});
});

async function getOpenAI(key?: string) {
    const response = await fetch(`https://api.openai.com/v1/models`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key?.trim()}`,
        },
    });
    const json = await response.json();
    return json;
}

connectionsRouter.post('/test/openai', async (req, res) => {
    const request = req.body.key;
    const data = await getOpenAI(request);
    res.send({...data});
});