/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import { conversationsPath } from './main.js';
dotenv.config();

export const conversationsRouter = express.Router();

// get all conversations from the ../data/conversations/ folder
function fetchAllConversations() {
    const conversationFolderPath = path.join(conversationsPath);
    const conversationFiles = fs.readdirSync(conversationFolderPath);
    const conversationData = conversationFiles.map((file) => {
        if(!file.endsWith(".json")) return;
        const filePath = path.join(conversationFolderPath, file);
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    });
    return conversationData;
}

conversationsRouter.get('/conversations', (req, res) => {
    const conversationData = fetchAllConversations();
    res.send(conversationData);
});

// save a conversation to the ../data/conversations/ folder
function saveConversation(conversation: any) {
    const conversationFolderPath = path.join(conversationsPath);
    const filePath = path.join(conversationFolderPath, `${conversation._id}.json`);
    const conversationJson = JSON.stringify(conversation, null, 4); // Pretty print the JSON
    fs.writeFileSync(filePath, conversationJson, "utf-8");
}

conversationsRouter.post('/save/conversation', (req, res) => {
    const conversation = req.body;
    saveConversation(conversation);
    res.send({ message: "Conversation saved successfully!" });
});

// get a conversation by id from the ../data/conversations/ folder
function fetchConversationById(id: string) {
    const conversationFolderPath = path.join(conversationsPath);
    const filePath = path.join(conversationFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    } else {
        return null; // or handle the error as needed
    }
}

conversationsRouter.get('/conversations/:id', (req, res) => {
    const id = req.params.id;
    const conversation = fetchConversationById(id);
    if (conversation) {
        res.send(conversation);
    } else {
        res.status(404).send({ message: "Conversation not found" });
    }
});

//remove a conversation by id from the ../data/conversations/ folder
function removeConversationById(id: string) {
    const conversationFolderPath = path.join(conversationsPath);
    const filePath = path.join(conversationFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    } else {
        return null; // or handle the error as needed
    }
}

conversationsRouter.delete('/conversations/:id', (req, res) => {
    const id = req.params.id;
    removeConversationById(id);
    res.send({ message: "Conversation removed successfully!" });
});