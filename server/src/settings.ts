/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
dotenv.config();
import { settingsPath } from "./main.js";

export const settingsRouter = express.Router();

// get all settings from the ../data/settings/ folder
function fetchAllSettings() {
    const settingFolderPath = path.join(settingsPath);
    const settingFiles = fs.readdirSync(settingFolderPath);
    const settingData = settingFiles.map((file) => {
        if(!file.endsWith(".json")) return;
        const filePath = path.join(settingFolderPath, file);
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    });
    return settingData;
}

settingsRouter.get('/settings', (req, res) => {
    const settingData = fetchAllSettings();
    res.send(settingData);
});

// save a setting to the ../data/settings/ folder
function saveSetting(setting: any) {
    const settingFolderPath = path.join(settingsPath);
    const filePath = path.join(settingFolderPath, `${setting.id}.json`);
    const settingJson = JSON.stringify(setting, null, 4); // Pretty print the JSON
    fs.writeFileSync(filePath, settingJson, "utf-8");
}

settingsRouter.post('/save/setting', (req, res) => {
    const setting = req.body;
    saveSetting(setting);
    res.send({ message: "Setting saved successfully!" });
});

// get a setting by id from the ../data/settings/ folder
function fetchSettingById(id: string) {
    const settingFolderPath = path.join(settingsPath);
    const filePath = path.join(settingFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    } else {
        return null; // or handle the error as needed
    }
}

settingsRouter.get('/settings/:id', (req, res) => {
    const id = req.params.id;
    const setting = fetchSettingById(id);
    if (setting) {
        res.send(setting);
    } else {
        res.status(404).send({ message: "Setting not found" });
    }
});

//remove a setting by id from the ../data/settings/ folder
function removeSettingById(id: string) {
    const settingFolderPath = path.join(settingsPath);
    const filePath = path.join(settingFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    } else {
        return null; // or handle the error as needed
    }
}

settingsRouter.delete('/settings/:id', (req, res) => {
    const id = req.params.id;
    removeSettingById(id);
    res.send({ message: "Setting removed successfully!" });
});