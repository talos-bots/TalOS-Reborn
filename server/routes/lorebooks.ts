import express from 'express';
import fs from "fs";
import path from "path";
import { lorebooksPath } from '../server.js';

export const lorebooksRouter = express.Router();

// Get all lorebooks
function fetchAllLorebooks() {
    try {
        const lorebooksFolderPath = path.join(lorebooksPath);
        const lorebooksFiles = fs.readdirSync(lorebooksFolderPath);
        const lorebooksData = lorebooksFiles.map((file) => {
            if(!file.endsWith(".json")) return;
            const filePath = path.join(lorebooksFolderPath, file);
            const fileData = fs.readFileSync(filePath, "utf-8");
            return JSON.parse(fileData);
        });
        return lorebooksData;
    } catch (err) {
        console.log(err);
    }
}

lorebooksRouter.get('/lorebooks', (req, res) => {
    const lorebooksData = fetchAllLorebooks();
    res.send(lorebooksData);
});

// Save a lorebook
function saveLorebook(lorebooks: any) {
    try {
        const lorebooksFolderPath = path.join(lorebooksPath);
        const filePath = path.join(lorebooksFolderPath, `${lorebooks.id}.json`);
        const lorebooksJson = JSON.stringify(lorebooks, null, 4); // Pretty print the JSON
        fs.writeFileSync(filePath, lorebooksJson, "utf-8");
    } catch (err) {
        console.log(err);
    }
}

lorebooksRouter.post('/save/lorebook', (req, res) => {
    const lorebooks = req.body;
    saveLorebook(lorebooks);
    res.send({ message: "Lorebook saved successfully!" });
});

// Get a lorebook by id
export function fetchLorebookById(id: string) {
    try {
        const lorebooksFolderPath = path.join(lorebooksPath);
        const filePath = path.join(lorebooksFolderPath, `${id}.json`);
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, "utf-8");
            return JSON.parse(fileData);
        } else {
            return null; // or handle the error as needed
        }
    } catch (err) {
        console.log(err);
    }
}

lorebooksRouter.get('/lorebooks/:id', (req, res) => {
    try {
        const id = req.params.id;
        const lorebooks = fetchLorebookById(id);
        if (lorebooks) {
            res.send(lorebooks);
        } else {
            res.status(404).send({ message: "Lorebook not found" });
        }
    } catch (err) {
        console.log(err);
    }
});

// Remove a lorebook by id
export function removeLorebookById(id: string) {
    try{
        const lorebooksFolderPath = path.join(lorebooksPath);
        const filePath = path.join(lorebooksFolderPath, `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            return null; // or handle the error as needed
        }
    } catch (err) {
        console.log(err);
    }
}

lorebooksRouter.delete('/lorebooks/:id', (req, res) => {
    const id = req.params.id;
    removeLorebookById(id);
    res.send({ message: "Lorebook deleted successfully!" });
});