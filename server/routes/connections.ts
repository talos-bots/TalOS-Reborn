import express from 'express';
import fs from "fs";
import path from "path";
import { connectionsPath } from '../server.js';
import { SettingsInterface, MancerSettingsInterface, GenericCompletionConnectionTemplate } from '../typings/types.js';

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
    try{
        const endpointURLObject = new URL(url);
        const response = await fetch(`${endpointURLObject.protocol}//${endpointURLObject.hostname}${endpointURLObject.port? `:${endpointURLObject.port}` : ''}` + `/v1/models`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': (key? key.length > 0? `Bearer ${key.trim()}` : '' : ''),
                'x-api-key': (key? key.length > 0? `${key.trim()}` : '' : ''),
            }
        
        }).then((response) => {
            return response;
        }).catch((error) => {
            console.log(error);
            return error;
        });
        console.log(response);
        if (!response.ok) {
            console.log('Connection models not found');
            throw Error(`Error: ${response.status}`);
        }
        const data = await response.json()
        console.log(data);
        return data;
    }catch(error){
        console.log(error);
        return error;
    }
}

connectionsRouter.post('/test/connections', async (req, res) => {
    console.log(req.body);
    const url = req.body.url;
    const key = req.body.key;
    const data = await fetchGenericConnectionModels(url as string, key as string);
    res.send({data});
});

async function getMancerModels(key?: string) {
    try{
        const response = await fetch(`https://neuro.mancer.tech/oai/v1/models`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key?.trim()}`,
            },
        }).then((response) => {
            return response;
        }).catch((error) => {
            console.log(error);
            return error;
        });
        if (!response.ok) {
            console.log('Connection models not found');
            throw Error(`Error: ${response.status}`);
        }
        const json = await response.json();
        return json;
    }catch(error){
        console.log(error);
        return error;
    }
}

connectionsRouter.post('/test/mancer', async (req, res) => {
    const request = req.body.key;
    const data = await getMancerModels(request);
    res.send({data});
});

async function getPalmModels(key?: string){
    try{
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((response) => {
            return response;
        }).catch((error) => {
            console.log(error);
            return error;
        });
        if (!response.ok) {
            console.log('Connection models not found');
            throw Error(`Error: ${response.status}`);
        }
        const json = await response.json();
        return json;
    }catch(error){
        console.log(error);
        return error;
    }
}

connectionsRouter.post('/test/palm', async (req, res) => {
    const request = req.body.key;
    const data = await getPalmModels(request);
    res.send({data});
});

async function getOpenAI(key?: string) {
    try{
        const response = await fetch(`https://api.openai.com/v1/models`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key?.trim()}`,
            },
        }).then((response) => {
            return response;
        }).catch((error) => {
            console.log(error);
            return error;
        });
        if (!response.ok) {
            console.log('Connection models not found');
            throw Error(`Error: ${response.status}`);
        }
        const json = await response.json();
        return json;
    }catch(error){
        console.log(error);
        return error;
    }
}

connectionsRouter.post('/test/openai', async (req, res) => {
    const request = req.body.key;
    const data = await getOpenAI(request);
    res.send(data);
});

async function getOpenRouter(key?: string) {
    try {
        const response = await fetch(`https://openrouter.ai/api/v1/models`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key?.trim()}`,
            },
        }).then((response) => {
            return response;
        }).catch((error) => {
            console.log(error);
            return error;
        });
        if (!response.ok) {
            console.log('Connection models not found');
            throw Error(`Error: ${response.status}`);
        }
        const json = await response.json();
        return json;

    } catch (error) {
        return error;
    }
}

connectionsRouter.post('/test/openrouter', async (req, res) => {
    const request = req.body.key;
    const data = await getOpenRouter(request);
    res.send({data});
});

async function getKobold(url: string, key?: string){
    try{
        const endpointURLObject = new URL(url);
        const response = await fetch(`${endpointURLObject.protocol}//${endpointURLObject.hostname}${endpointURLObject.port? `:${endpointURLObject.port}` : ''}` + `/api/v1/model`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': (key? key.length > 0? `Bearer ${key.trim()}` : '' : ''),
                'x-api-key': (key? key.length > 0? `${key.trim()}` : '' : ''),
            },
        }).then((response) => {
            return response;
        }).catch((error) => {
            console.log(error);
            return error;
        });
        if (!response.ok) {
            console.log('Connection models not found');
            throw Error(`Error: ${response.status}`);
        }
        const json = await response.json();
        return json;
    }catch(error){
        console.log(error);
        return error;
    }
}

connectionsRouter.post('/test/kobold', async (req, res) => {
    const url = req.body.url;
    const key = req.body.key;
    const data = await getKobold(url as string, key as string);
    res.send({data});
});

async function getClaude(url: string, key?: string, aws: boolean = false){
    try{
        const endpointURLObject = new URL(url);
        const response = await fetch(`${endpointURLObject.protocol}//${endpointURLObject.hostname}${endpointURLObject.port? `:${endpointURLObject.port}` : ''}` + (aws ? '/proxy/aws/claude/v1/models' : '/proxy/anthropic/v1/models'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': (key? key.length > 0? `Bearer ${key.trim()}` : '' : ''),
                'x-api-key': (key? key.length > 0? `${key.trim()}` : '' : ''),
            },
        }).then((response) => {
            return response;
        }).catch((error) => {
            console.log(error);
            return error;
        });
        if (!response.ok) {
            console.log('Connection models not found');
            throw Error(`Error: ${response.status}`);
        }
        const json = await response.json();
        return json;
    }catch(error){
        console.log(error);
        return error;
    }
}

connectionsRouter.post('/test/claude', async (req, res) => {
    const url = req.body.url;
    const key = req.body.key;
    const aws = req.body.aws;
    const data = await getClaude(url as string, key as string, aws as boolean);
    res.send({data});
});