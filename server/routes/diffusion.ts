/* eslint-disable no-case-declarations */
import { diffusionConnectionsPath } from "../server.js";
import express from 'express';
import fs from "fs";
import path from "path";

import OpenAI from 'openai';
import { extractFileFromZipBuffer, extractFilesFromZipBuffer, writeBase64ToPNGFile } from "../helpers/index.js";
import e from "express";
import { NovelAIRequest } from "../typings/novelAI.js";

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
    return connectionData as DiffusionCompletionConnectionTemplate[];
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
                if(response3){
                    res.send(response3);
                }else {
                    res.status(500).send({ message: 'OpenAI said no :(' })
                }
                break;
            case "dall-e-2":
                const response2 = await generateDalle2Image(prompt, size, samples, connectionId);
                if(response2){
                    res.send(response2);
                }else {
                    res.status(500).send({ message: 'OpenAI said no :(' })
                }
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
    // extract the image from the response
    if(response.created && response.created > 0){
        const image = response.data.map((image: any) => {
            return {
                url: image.url,
                revisedPrompt: image.revised_prompt ?? '',
            }
        });
        return image;
    }
    return;
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
    console.log(key);
    const response = await testDallekey(key);
    res.send(response);
});

async function testNovelAIKey(key: string) {
    try {
        const response = await fetch('https://api.novelai.net/user/subscription', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key.trim()}`
            }
        });
        console.log(response);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else if (response.status == 401) {
            console.log('NovelAI Access Token is incorrect.');
            return;
        }
        else {
            console.log('NovelAI returned an error:', response.statusText);
            return;
        }
    }
    catch (error) {
        console.log('Failed to test NovelAI key:', error);
        return;
    }
}

diffusionRouter.post('/test-novelai-key', async (req, res) => {
    const { key } = req.body;
    console.log(key);
    const response = await testNovelAIKey(key);
    if(response){
        res.send(response);
    }else {
        res.status(500).send({ message: 'NovelAI said no :(' })
    }
});

export async function findNovelAIConnection(): Promise<DiffusionCompletionConnectionTemplate | undefined>{
    const connections = fetchAllConnections();
    const novelAIConnection = connections.find((connection) => {
        return connection.type as DiffusionType === 'NovelAI';
    });
    return novelAIConnection;
}

export const novelAIDefaults = {
    height: 1024,
    width: 1024,
    scale: 5,
    sampler: 'k_dpmpp_2m',
    steps: 28,
    n_samples: 1,
    ucPreset: 0,
    seed: Math.floor(Math.random() * 9999999999),
    model: 'nai-diffusion-3',
}

export async function generateNovelAIImage(requestBody: NovelAIRequest) {
    const { prompt, connectionId, negative_prompt, height, width, guidance, sampler, steps, number_of_samples, ucPreset, seed, model } = requestBody;
    const connection = fetchConnectionById(connectionId);
    if (!connection) {
        throw new Error("Connection not found");
    }
    let selectedModel = model;
    if(!selectedModel || selectedModel.length < 1){
        selectedModel = connection.model;
    }
    let existingSeed = seed;
    if(!existingSeed || existingSeed < 1){
        existingSeed = Math.floor(Math.random() * 9999999999);
    }
    const generateResult = await fetch('https://api.novelai.net/ai/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${connection.key}`
        },
        body: JSON.stringify({
            input: prompt || 'A painting of a cat',
            model: selectedModel || 'nai-diffusion-3',
            parameters: {
                negative_prompt: negative_prompt ?? 'loli, patreon, text, twitter, child',
                height: height ?? novelAIDefaults.height,
                width: width ?? novelAIDefaults.width,
                scale: guidance ?? novelAIDefaults.scale,
                seed: (existingSeed > 0) ? existingSeed : Math.floor(Math.random() * 9999999999),
                sampler: sampler ?? novelAIDefaults.sampler,
                steps: steps ?? novelAIDefaults.steps,
                n_samples: number_of_samples ?? novelAIDefaults.n_samples,
                ucPreset: ucPreset ?? novelAIDefaults.ucPreset,
                qualityToggle: true,
                add_original_image: false,
                controlnet_strength: 1,
                dynamic_thresholding: false,
                legacy: false,
                sm: false,
                sm_dyn: false,
                uncond_scale: 1,
            },
        })
    })
    if (!generateResult.ok) {
        const text = await generateResult.text();
        console.log('NovelAI returned an error.', generateResult.statusText, text);
        return;
    }

    const archiveBuffer = await generateResult.arrayBuffer();
    if(!archiveBuffer) {
        console.log('NovelAI returned an empty response.');
        return;
    }
    if(number_of_samples && number_of_samples > 1){
        const imageBuffers = await extractFilesFromZipBuffer(archiveBuffer, '.png');
        const imageFiles = imageBuffers.map((imageBuffer) => {
            const originalBase64 = imageBuffer.toString('base64');
            const imageFile = writeBase64ToPNGFile(originalBase64);
            return imageFile;
        });
        return imageFiles.map((imageFile) => {
            return {
                url: imageFile,
                revisedPrompt: '',
            }
        });
    }else {
        const imageBuffer = await extractFileFromZipBuffer(archiveBuffer, '.png');
        const originalBase64 = imageBuffer.toString('base64');
        const imageFile = writeBase64ToPNGFile(originalBase64);
        return [{
            url: imageFile,
            revisedPrompt: '',
        }]
    }
}

diffusionRouter.post('/novelai/generate-image', async (req, res) => {
    try {
        // ask for image
        const response = await generateNovelAIImage(req.body);
        if(response){
            // yay! got an image :D
            return res.send(response)
        }else {
            //sometimes it fails, idk why
            return res.status(500).send({ message: 'NovelAI said no :(' })
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error });
    }
});