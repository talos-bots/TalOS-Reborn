import express from 'express';
import fs from "fs";
import path from "path";
import { DiscordGlobalConfig, discordConfigPath, discordSettingsPath } from "../server.js";
import { DiscordConfig } from '../typings/types.js';

export const discordConfigRoute = express.Router();

export function getGlobalConfig(): DiscordGlobalConfig {
    if(fs.existsSync(discordSettingsPath)){
        const fileData = fs.readFileSync(discordSettingsPath, "utf-8");
        return JSON.parse(fileData) as DiscordGlobalConfig;
    }
    return {
        currentConfig: "",
        autoRestart: false,
    } as DiscordGlobalConfig;
}

function fetchAlldiscordConfigs() {
    const discordConfigFolderPath = path.join(discordConfigPath);
    const discordConfigFiles = fs.readdirSync(discordConfigFolderPath);
    const discordConfigData = discordConfigFiles.map((file) => {
        if(!file.endsWith(".json")) return;
        const filePath = path.join(discordConfigFolderPath, file);
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    });
    return discordConfigData;
}

discordConfigRoute.get('/discordConfigs', (req, res) => {
    const discordConfigData = fetchAlldiscordConfigs();
    res.send(discordConfigData);
});

// save a discordConfig to the ../data/discordConfigs/ folder
function savediscordConfig(discordConfig: any) {
    const discordConfigFolderPath = path.join(discordConfigPath);
    const filePath = path.join(discordConfigFolderPath, `${discordConfig.id}.json`);
    const discordConfigJson = JSON.stringify(discordConfig, null, 4); // Pretty print the JSON
    fs.writeFileSync(filePath, discordConfigJson, "utf-8");
}

discordConfigRoute.post('/save/discordConfig', (req, res) => {
    const discordConfig = req.body;
    savediscordConfig(discordConfig);
    res.send({ message: "discordConfig saved successfully!" });
});

// get a discordConfig by id from the ../data/discordConfigs/ folder
export function fetchdiscordConfigById(id: string) {
    const discordConfigFolderPath = path.join(discordConfigPath);
    const filePath = path.join(discordConfigFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData) as DiscordConfig;
    } else {
        return null; // or handle the error as needed
    }
}

discordConfigRoute.get('/discordConfigs/:id', (req, res) => {
    const id = req.params.id;
    const discordConfig = fetchdiscordConfigById(id);
    if (discordConfig) {
        res.send(discordConfig);
    } else {
        res.status(404).send({ message: "discordConfig not found" });
    }
});

//remove a discordConfig by id from the ../data/discordConfigs/ folder
function removediscordConfigById(id: string) {
    const discordConfigFolderPath = path.join(discordConfigPath);
    const filePath = path.join(discordConfigFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    } else {
        return null; // or handle the error as needed
    }
}

discordConfigRoute.delete('/discordConfig/:id', (req, res) => {
    const id = req.params.id;
    removediscordConfigById(id);
    res.send({ message: "discordConfig removed successfully!" });
});

function setGlobalConfig(globalConfig: DiscordGlobalConfig) {
    const discordConfigJson = JSON.stringify(globalConfig, null, 4);
    fs.writeFileSync(discordSettingsPath, discordConfigJson, "utf-8");
}

discordConfigRoute.post('/save/discordDefaults', (req, res) => {
    const globalConfig = req.body;
    setGlobalConfig(globalConfig);
    res.send({ message: "globalConfig saved successfully!" });
});

discordConfigRoute.get('/discordDefaults', (req, res) => {
    const globalConfig = getGlobalConfig();
    res.send(globalConfig);
});