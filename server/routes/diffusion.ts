/* eslint-disable no-case-declarations */
import { diffusionConnectionsPath } from "../server.js";
import express from 'express';
import fs from "fs";
import path from "path";

import OpenAI from 'openai';

export type DiffusionType = 'Dalle' | 'Auto1111' | 'SDAPI' | 'Reborn' | 'Google' | 'Stability' | 'NovelAI'
export type DiffusionCompletionConnectionTemplate = {
    id: string;
    key?: string;
    url?: string;
    model?: string;
    name?: string;
    type?: DiffusionType;
}

export const diffusionRouter = express.Router();

// get all connections from the ../data/connections/ folder
function fetchAllConnections() {
    const connectionFolderPath = path.join(diffusionConnectionsPath);
    const connectionFiles = fs.readdirSync(connectionFolderPath);
    const connectionData = connectionFiles.map((file) => {
        if(!file.endsWith(".json")) return;
        const filePath = path.join(connectionFolderPath, file);
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    });
    return connectionData;
}

diffusionRouter.get('/diffusion-connections', (req, res) => {
    const connectionData = fetchAllConnections();
    res.send(connectionData);
});

// save a connection to the ../data/connections/ folder
function saveConnection(connection: any) {
    const connectionFolderPath = path.join(diffusionConnectionsPath);
    const filePath = path.join(connectionFolderPath, `${connection.id}.json`);
    const connectionJson = JSON.stringify(connection, null, 4); // Pretty print the JSON
    fs.writeFileSync(filePath, connectionJson, "utf-8");
}

diffusionRouter.post('/save/diffusion-connection', (req, res) => {
    const connection = req.body;
    saveConnection(connection);
    res.send({ message: "Connection saved successfully!" });
});

// get a connection by id from the ../data/connections/ folder
export function fetchConnectionById(id: string) {
    const connectionFolderPath = path.join(diffusionConnectionsPath);
    const filePath = path.join(connectionFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData) as DiffusionCompletionConnectionTemplate;
    } else {
        return null; // or handle the error as needed
    }
}

diffusionRouter.get('/diffusion-connection/:id', (req, res) => {
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
    const connectionFolderPath = path.join(diffusionConnectionsPath);
    const filePath = path.join(connectionFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    } else {
        return null; // or handle the error as needed
    }
}

diffusionRouter.delete('/diffusion-connection/:id', (req, res) => {
    const id = req.params.id;
    removeConnectionById(id);
    res.send({ message: "Connection removed successfully!" });
});

type DalleModels = "dall-e-2" | "dall-e-3"
type DalleSize3 = '1024x1024' | '1792x1024' | '1024x1792'
type DalleSize2 = '256x256' | '512x512' | '1024x1024'
type DalleStyle = "vivid" | "natural";

diffusionRouter.post('/dalle/generate', async (req, res) => {
    const { prompt, size, samples, style, connectionId, model_id } = req.body;
    try {
        switch (model_id) {
            case "dall-e-3":
                const response3 = await generateDalle3Image(prompt, size, style, connectionId);
                res.send(response3);
                break;
            case "dall-e-2":
                const response2 = await generateDalle2Image(prompt, size, samples, connectionId);
                res.send(response2);
                break;
            default:
                res.send("Model not found");
                break;
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error });
    }
});

async function generateDalle3Image(prompt: string | null, size: DalleSize3 | null, style: DalleStyle | null, connectionId: string) {
    const connection = fetchConnectionById(connectionId);
    if (!connection) {
        throw new Error("Connection not found");
    }
    const openai = new OpenAI({apiKey: connection.key});
    const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt || 'A painting of a cat',
        n: 1,
        size: size || '1024x1024',
        style: style || 'vivid',
    });
    return response;
}

async function generateDalle2Image(prompt: string | null, size: DalleSize2 | null, samples: number | null, connectionId: string) {
    const connection = fetchConnectionById(connectionId);
    if (!connection) {
        throw new Error("Connection not found");
    }
    const openai = new OpenAI({apiKey: connection.key});
    const response = await openai.images.generate({
        model: 'dall-e-2',
        prompt: prompt || 'A painting of a cat',
        n: samples,
        size: size || '512x512',    });
    return response;
}

async function testDallekey(key: string) {
    try {
        const openai = new OpenAI({apiKey: key});
        const response = await openai.models.list();
        return response;
    } catch (error) {
        return false;
    }
}

diffusionRouter.post('/test-dalle-key', async (req, res) => {
    const { key } = req.body;
    const response = await testDallekey(key);
    res.send(response);
});