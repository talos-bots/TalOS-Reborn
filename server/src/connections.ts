/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import { connectionsPath } from './main.js';
dotenv.config();

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
function fetchConnectionById(id: string) {
    const connectionFolderPath = path.join(connectionsPath);
    const filePath = path.join(connectionFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
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

connectionsRouter.delete('/connections/:id', (req, res) => {
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