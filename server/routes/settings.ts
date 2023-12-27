import express from 'express';
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
dotenv.config();
import { appSettingsPath, settingsPath } from "../server.js";
import { InstructMode, SettingsInterface } from './connections.js';
import { DefaultSettings } from '../defaults/settings.js';

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
    return settingData.concat(DefaultSettings);
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
export function fetchSettingById(id: string) {
    try {
        const filePath = path.join(settingsPath, `${id}.json`);
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData) as SettingsInterface;
    } catch (error) {
        const setting = checkForSettingsInDefaultArray(id);
        if(setting){
            return setting;
        }
        return null;
    }
}

function checkForSettingsInDefaultArray(id:string){
    for(let i = 0; i < DefaultSettings.length; i++){
        if(DefaultSettings[i].id === id){
            return DefaultSettings[i];
        }
    }
    return null;
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
    try {
        const settingFolderPath = path.join(settingsPath);
        const filePath = path.join(settingFolderPath, `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            return null; // or handle the error as needed
        }
    } catch (error) {
        return null;
    }
}

settingsRouter.delete('/settings/:id', (req, res) => {
    const id = req.params.id;
    removeSettingById(id);
    res.send({ message: "Setting removed successfully!" });
});

export interface AppSettingsInterface {
    defaultConnection: string;
    defaultSettings: string;
    admins: string[];
    enableCaptioning: boolean;
    enableEmbedding: boolean;
    enableQuestionAnswering: boolean;
    enableZeroShotClassification: boolean;
    enableYesNoMaybe: boolean;
    defaultDiffusionConnection: string;
    jwtSecret: string;
}

export interface UsageArguments {
    overrideSettings: string | null;
    overrideConnection: string | null;
    overrideInstruct: InstructMode | null;
    humanReplyChance: number | null;
    humanMentionReplyChance: number | null;
    botReplyChance: number | null;
    botMentionReplyChance: number | null;
    doThoughts: boolean | null;
    doSelfies: boolean | null;
    doEmotions: boolean | null;
    doSprites: boolean | null;
    doBackgrounds: boolean | null;
    doAnimations: boolean | null;
    doSounds: boolean | null;
    badWords: string[] | null;
    modelOverride: string | null;
    floatingGuidance: string | null;
}

// get all appSettings from the ../data/appSettings.json file
export function fetchAllAppSettings() {
    try {
        const appSettingsData = fs.readFileSync(appSettingsPath, "utf-8");
        if (!appSettingsData) {
            return null;
        }
        return JSON.parse(appSettingsData) as AppSettingsInterface;
    } catch (error) {
        return null;
    }

}

settingsRouter.get('/appSettings', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    res.send(appSettingsData);
});

// save an appSetting to the ../data/appSettings.json file
function saveAppSetting(appSetting: AppSettingsInterface) {
    const appSettingsJson = JSON.stringify(appSetting, null, 4); // Pretty print the JSON
    fs.writeFileSync(appSettingsPath, appSettingsJson, "utf-8");
}

settingsRouter.post('/save/appSetting', (req, res) => {
    const appSetting = req.body;
    saveAppSetting(appSetting);
    res.send({ message: "AppSetting saved successfully!" });
});

settingsRouter.get('/appSettings/connection', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        res.send(appSettingsData.defaultConnection);
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

settingsRouter.get('/appSettings/settings', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        res.send(appSettingsData.defaultSettings);
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// set the default connection in the ../data/appSettings.json file
settingsRouter.post('/appSettings/connection', (req, res) => {
    const id = req.body.connectionid;
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        appSettingsData.defaultConnection = id;
        saveAppSetting(appSettingsData);
        res.send({ message: "Default connection set successfully!" });
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// set the default settings in the ../data/appSettings.json file
settingsRouter.post('/appSettings/settings', (req, res) => {
    const id = req.body.settingsid;
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        appSettingsData.defaultSettings = id;
        saveAppSetting(appSettingsData);
        res.send({ message: "Default settings set successfully!" });
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// get all admins from the ../data/appSettings.json file
settingsRouter.get('/appSettings/admins', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        res.send(appSettingsData.admins);
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// set the admins in the ../data/appSettings.json file
settingsRouter.post('/appSettings/admins', (req, res) => {
    const admins = req.body.admins;
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        appSettingsData.admins = admins;
        saveAppSetting(appSettingsData);
        res.send({ message: "Admins set successfully!" });
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// get all enableCaptioning from the ../data/appSettings.json file
settingsRouter.get('/appSettings/enableCaptioning', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        res.send(appSettingsData.enableCaptioning);
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// set the enableCaptioning in the ../data/appSettings.json file
settingsRouter.post('/appSettings/enableCaptioning', (req, res) => {
    const enableCaptioning = req.body.enableCaptioning;
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        appSettingsData.enableCaptioning = enableCaptioning;
        saveAppSetting(appSettingsData);
        res.send({ message: "enableCaptioning set successfully!" });
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// get all enableEmbedding from the ../data/appSettings.json file
settingsRouter.get('/appSettings/enableEmbedding', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        res.send(appSettingsData.enableEmbedding);
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// set the enableEmbedding in the ../data/appSettings.json file
settingsRouter.post('/appSettings/enableEmbedding', (req, res) => {
    const enableEmbedding = req.body.enableEmbedding;
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        appSettingsData.enableEmbedding = enableEmbedding;
        saveAppSetting(appSettingsData);
        res.send({ message: "enableEmbedding set successfully!" });
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// get all enableQuestionAnswering from the ../data/appSettings.json file
settingsRouter.get('/appSettings/enableQuestionAnswering', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        res.send(appSettingsData.enableQuestionAnswering);
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// set the enableQuestionAnswering in the ../data/appSettings.json file
settingsRouter.post('/appSettings/enableQuestionAnswering', (req, res) => {
    const enableQuestionAnswering = req.body.enableQuestionAnswering;
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        appSettingsData.enableQuestionAnswering = enableQuestionAnswering;
        saveAppSetting(appSettingsData);
        res.send({ message: "enableQuestionAnswering set successfully!" });
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// get all enableZeroShotClassification from the ../data/appSettings.json file
settingsRouter.get('/appSettings/enableZeroShotClassification', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        res.send(appSettingsData.enableZeroShotClassification);
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// set the enableZeroShotClassification in the ../data/appSettings.json file
settingsRouter.post('/appSettings/enableZeroShotClassification', (req, res) => {
    const enableZeroShotClassification = req.body.enableZeroShotClassification;
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        appSettingsData.enableZeroShotClassification = enableZeroShotClassification;
        saveAppSetting(appSettingsData);
        res.send({ message: "enableZeroShotClassification set successfully!" });
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// get all enableYesNoMaybe from the ../data/appSettings.json file
settingsRouter.get('/appSettings/enableYesNoMaybe', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        res.send(appSettingsData.enableYesNoMaybe);
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// set the enableYesNoMaybe in the ../data/appSettings.json file
settingsRouter.post('/appSettings/enableYesNoMaybe', (req, res) => {
    const enableYesNoMaybe = req.body.enableYesNoMaybe;
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        appSettingsData.enableYesNoMaybe = enableYesNoMaybe;
        saveAppSetting(appSettingsData);
        res.send({ message: "enableYesNoMaybe set successfully!" });
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// get all defaultDiffusionConnection from the ../data/appSettings.json file
settingsRouter.get('/appSettings/defaultDiffusionConnection', (req, res) => {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        res.send(appSettingsData.defaultDiffusionConnection);
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
});

// set the defaultDiffusionConnection in the ../data/appSettings.json file
settingsRouter.get('/appSettings/defaultDiffusionConnection', (req, res) => {
    const diffusionID = req.body.diffusionId
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        appSettingsData.defaultDiffusionConnection = diffusionID;
        saveAppSetting(appSettingsData);
        res.send({ message: "defaultDiffusionConnection set successfully!" });
    } else {
        res.status(404).send({ message: "AppSetting not found" });
    }
})

//function that checks if the user is an admin
export function isAdmin(user: string) {
    const appSettingsData = fetchAllAppSettings();
    if (appSettingsData) {
        const admins = appSettingsData.admins;
        if (admins.includes(user)) {
            return true;
        }
    }
    return false;
}

settingsRouter.get('/appSettings/isAdmin/:user', (req, res) => {
    const user = req.params.user;
    const isAdministrator = isAdmin(user);
    res.send(isAdmin);
});