/* eslint-disable prefer-const */
/* eslint-disable no-case-declarations */
import { diffusionConnectionsPath, uploadsPath } from "../server.js";
import express from 'express';
import fs from "fs";
import path from "path";

import OpenAI from 'openai';
import { extractFileFromZipBuffer, extractFilesFromZipBuffer, writeBase64ToPNGFile } from "../helpers/index.js";
import e from "express";
import { NovelAIRequest } from "../typings/novelAI.js";
import axios from "axios";

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
export function fetchConnectionById(id: string): DiffusionCompletionConnectionTemplate | null{
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

export async function findSDXLConnection(): Promise<DiffusionCompletionConnectionTemplate | undefined>{
    const connections = fetchAllConnections();
    const sdxlConnection = connections.find((connection) => {
        return connection.type as DiffusionType === 'Auto1111';
    });
    return sdxlConnection;
}

export const novelAIDefaults = {
    height: 1024,
    width: 1024,
    scale: 5,
    sampler: 'k_euler',
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
                negative_prompt: negative_prompt ?? '',
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

export const sdxlImage = async (request: NovelAIRequest): Promise<any> => {
    const { prompt, negative_prompt, height, width, guidance, sampler, steps, number_of_samples, ucPreset, seed, model, connectionId } = request;
    try {
        const response = await makeImage(prompt ?? '', negative_prompt, steps, guidance, width, height, .25, connectionId)
        return response;
    } catch (error: any) {
        throw new Error(`Failed to send data: ${error.message}`);
    }
}

export async function makePromptData(
    prompt: string, 
    negativePrompt: string = '', 
    steps: number = 26, 
    cfg: number = 7, 
    width: number = 1024, 
    height: number = 1024, 
    denoisingStrength: number = 0.25
    ){
    const data = {
        "denoising_strength": denoisingStrength,
        "firstphase_width": width,
        "firstphase_height": height,
        "prompt": prompt,
        "seed": -1,
        "sampler_name": "Euler a",
        "batch_size": 1,
        "steps": steps,
        "cfg_scale": cfg,
        "width": width,
        "height": height,
        "do_not_save_samples": true,
        "do_not_save_grid": true,
        "negative_prompt": negativePrompt,
        "sampler_index": "Euler a",
        "send_images": true,
        "save_images": false,
    };
    return JSON.stringify(data);
}

export async function makeImage(prompt: string, negativePrompt?: string, steps?: number, cfg?: number, width?: number, height?: number, denoisingStrength?: number, connectionId?: string){
    if(!connectionId){
        throw new Error("Connection ID not provided");
    }
    const connection = fetchConnectionById(connectionId);
    if (!connection) {
        throw new Error("Connection not found");
    }
    const url = new URL(connection.url as string);
    url.pathname = '/sdapi/v1/txt2img';
    const data = await makePromptData(prompt, negativePrompt, steps, cfg, width, height, denoisingStrength);
    const res = await axios({
        method: 'post',
        url: url.toString(),
        data: data,
        headers: { 'Content-Type': 'application/json' },
    }).then((res) => {
        return res;
    }).catch((err) => {
        console.log(err);
    });
    url.pathname = '/sdapi/v1/options';
    const model = await axios.get(url.toString()).then((res) => {
        return res.data.sd_model_checkpoint;
    }).catch((err) => {
        console.log(err);
    });
    if(!res){
        return null;
    }
    const fileName = `image_${getTimestamp()}.png`;
    // Save image to uploads folder
    const newPath = path.join(uploadsPath, fileName);
    const buffer = Buffer.from(res.data.images[0].split(';base64,').pop(), 'base64');
    await fs.promises.writeFile(newPath, buffer);
    return {name: fileName, base64: res.data.images[0].split(';base64,').pop(), model: model};
}

function getTimestamp() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed in JavaScript
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export async function getSDXLModels(link: string, key: string){
    let url = new URL(link);
    url.pathname = '/sdapi/v1/sd-models';
    const res = await axios({
        method: 'get',
        url: url.toString(),
        headers: { 'Content-Type': 'application/json', 
        'Authorization': `Bearer ${key}` },
    }).then((res) => {
        return res;
    }).catch((err) => {
        console.log('Failed to get SD models');
    });
    if(!res){
        return null;
    }
    return res.data;
}

diffusionRouter.post('/sdxl/generate-image', async (req, res) => {
    try {
        const response = await sdxlImage(req.body);
        if(response){
            return res.send(response);
        }else {
            return res.status(500).send({ message: 'SDXL said no :(' })
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error });
    }
});

diffusionRouter.post('/sdxl/models', async (req, res) => {
    const { link, key } = req.body;
    const response = await getSDXLModels(link, key);
    if(response){
        return res.send(response);
    }else {
        return res.status(500).send({ message: 'SDXL said no :(' })
    }
});