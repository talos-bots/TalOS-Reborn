/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';
import cors from 'cors';
import { createServer } from "node:http";
import { Server } from 'socket.io';
import multer from 'multer';
import bodyParser from 'body-parser';
import fs from "fs";
import path from "path";

const uploadsPath = './uploads';
export const dataPath = './data';
export const charactersPath = `${dataPath}/characters`;
export const settingsPath = `${dataPath}/settings`;
export const connectionsPath = `${dataPath}/connections`;
export const lorebooksPath = `${dataPath}/lorebooks`;
export const rulesPath = `${dataPath}/rules`;
export const scenariosPath = `${dataPath}/scenarios`;
export const skillsPath = `${dataPath}/skills`;
export const spellsPath = `${dataPath}/spells`;
export const weaponsPath = `${dataPath}/weapons`;
export const armorsPath = `${dataPath}/armors`;
export const conversationsPath = `${dataPath}/conversations`;

export const expressApp = express();
const port = 3003;

fs.mkdirSync(uploadsPath, { recursive: true });
fs.mkdirSync(dataPath, { recursive: true });
fs.mkdirSync(charactersPath, { recursive: true });
fs.mkdirSync(settingsPath, { recursive: true });
fs.mkdirSync(lorebooksPath, { recursive: true });
fs.mkdirSync(rulesPath, { recursive: true });
fs.mkdirSync(scenariosPath, { recursive: true });
fs.mkdirSync(skillsPath, { recursive: true });
fs.mkdirSync(spellsPath, { recursive: true });
fs.mkdirSync(weaponsPath, { recursive: true });
fs.mkdirSync(armorsPath, { recursive: true });
fs.mkdirSync(conversationsPath, { recursive: true });
fs.mkdirSync(connectionsPath, { recursive: true });

expressApp.use(express.static('public'));
expressApp.use(express.static('dist'));
expressApp.use(bodyParser.json({ limit: '1000mb' }));
expressApp.use(bodyParser.urlencoded({ limit: '1000mb', extended: true }));

const corsOptions = {
	origin: "*", 
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	credentials: true
};

expressApp.use(cors(corsOptions));
expressApp.use('/images', express.static(uploadsPath));

const server = createServer(expressApp);
export const expressAppIO = new Server(server, {
	cors: corsOptions
});

// Graceful shutdown function
function gracefulShutdown() {
	console.log('Shutting down gracefully...');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
}

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

//enable * on CORS for socket.io
expressAppIO.sockets.on('connection', (socket) => {
	console.log('Client connected:', socket.id);

	// Logging all events
	socket.onAny((eventName, ...args) => {
		console.log(`event: ${eventName}`, args);
	});
});

server.listen(port, () => {
	console.log(`Server started on http://localhost:${port}`);
});

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadsPath)
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname)
	}
});

const upload = multer({ storage: storage });

expressApp.post('/files/upload', upload.single('image'), (req, res) => {
	if (!req.file) {
		return res.status(400).send('No file uploaded.');
	}
	res.send(`File uploaded: ${req.file.originalname}`);
});

export type CharacterInterface = {
    _id: string;
    name: string;
    avatar: string;
    description: string;
    personality: string;
    mes_example: string;
    creator_notes: string;
    system_prompt: string;
    post_history_instructions: string;
    tags: string[];
    creator: string;
    visual_description: string;
    thought_pattern: string;
    first_mes: string;
    alternate_greetings: string[];
    scenario: string;
}

// get all characters from the ../data/characters/ folder
expressApp.get('/characters', (req, res) => {
    const characterData = fetchAllCharacters();
    res.send(characterData);
});

function fetchAllCharacters() {
    const characterFolderPath = path.join(charactersPath);
    const characterFiles = fs.readdirSync(characterFolderPath);
    const characterData = characterFiles.map((file) => {
        if(!file.endsWith(".json")) return;
        const filePath = path.join(characterFolderPath, file);
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    });
    return characterData;
}

// save a character to the ../data/characters/ folder
function saveCharacter(character: CharacterInterface) {
    const characterFolderPath = path.join(charactersPath);
    const filePath = path.join(characterFolderPath, `${character._id}.json`);
    const characterJson = JSON.stringify(character, null, 4); // Pretty print the JSON
    fs.writeFileSync(filePath, characterJson, "utf-8");
}

expressApp.post('/save/character', (req, res) => {
    const character = req.body;
    saveCharacter(character);
    res.send({ message: "Character saved successfully!" });
});

// get a character by id from the ../data/characters/ folder
function fetchCharacterById(id: string) {
    const characterFolderPath = path.join(charactersPath);
    const filePath = path.join(characterFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    } else {
        return null; // or handle the error as needed
    }
}

expressApp.get('/character/:id', (req, res) => {
    const id = req.params.id;
    const character = fetchCharacterById(id);
    if (character) {
        res.send(character);
    } else {
        res.status(404).send({ message: "Character not found" });
    }
});

//remove a character by id from the ../data/characters/ folder
function removeCharacterById(id: string) {
    const characterFolderPath = path.join(charactersPath);
    const filePath = path.join(characterFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    } else {
        return null; // or handle the error as needed
    }
}

expressApp.delete('/character/:id', (req, res) => {
    const id = req.params.id;
    removeCharacterById(id);
    res.send({ message: "Character removed successfully!" });
});

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

expressApp.get('/conversations', (req, res) => {
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

expressApp.post('/save/conversation', (req, res) => {
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

expressApp.get('/conversations/:id', (req, res) => {
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

expressApp.delete('/conversations/:id', (req, res) => {
    const id = req.params.id;
    removeConversationById(id);
    res.send({ message: "Conversation removed successfully!" });
});

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

expressApp.get('/settings', (req, res) => {
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

expressApp.post('/save/setting', (req, res) => {
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

expressApp.get('/settings/:id', (req, res) => {
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

expressApp.delete('/settings/:id', (req, res) => {
    const id = req.params.id;
    removeSettingById(id);
    res.send({ message: "Setting removed successfully!" });
});

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

expressApp.get('/connections', (req, res) => {
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

expressApp.post('/save/connection', (req, res) => {
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

expressApp.get('/connections/:id', (req, res) => {
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

expressApp.delete('/connections/:id', (req, res) => {
    const id = req.params.id;
    removeConnectionById(id);
    res.send({ message: "Connection removed successfully!" });
});

async function fetchGenericConnectionModels(url: string) {
    const endpointURLObject = new URL(url);
    const response = await fetch(`${endpointURLObject.protocol}//${endpointURLObject.hostname}${endpointURLObject.port? `:${endpointURLObject.port}` : ''}` + `/v1/models`);
    console.log(response);
    if (!response.ok) {
        console.log('Connection models not found');
        throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json()
    console.log(data);
    return data;
}

expressApp.post('/test/connections', async (req, res) => {
    const url = req.body.url;
    const data = await fetchGenericConnectionModels(url as string);
    res.send({...data});
});