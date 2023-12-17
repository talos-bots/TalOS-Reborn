/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from "node:http";
import { Server } from 'socket.io';
import multer from 'multer';
import bodyParser from 'body-parser';
import fs from "fs";
import path from "path";
import db from './database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const uploadsPath = './uploads';
export const dataPath = './data';
const profilePicturesPath = `${dataPath}/profile_pictures`;
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

const JWT_SECRET = process.env.JWT_SECRET

if(!JWT_SECRET) {
    const generateSecret = () => crypto.randomBytes(64).toString('hex');
    const secret = `JWT_SECRET=${generateSecret()}\n`;

    fs.appendFile('.env', secret, (err: any) => {
        if (err) throw err;
        console.log('.env file created with JWT_SECRET');
    });
    
    //restart the server
    console.log('Generated new JWT_SECRET... application will restart');
    process.exit(1);
}

fs.mkdirSync(uploadsPath, { recursive: true });
fs.mkdirSync(profilePicturesPath, { recursive: true });
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

expressApp.use(cookieParser());
expressApp.use(cors(corsOptions));
expressApp.use('/images', express.static(uploadsPath));
expressApp.use('/pfp', express.static(profilePicturesPath));

const server = createServer(expressApp);

const userConnections = new Map<string, string>();

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

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies['talosAuthToken'];
    if (token == null) return res.status(401).send('Access denied');

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).send('Invalid token');
        //@ts-expect-error - user is a property of the verify function
        req.user = user; // Ensure the type of user is defined and added to Request interface
        next();
    });
};

const authenticateTokenSocket = (token: string) => {
    if (token == null) return false;

    try {
        let userid = null;
        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (err) return false;
            userid = user.userId;
        });
        return userid;
    } catch (err) {
        return false;
    }
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

//enable * on CORS for socket.io
expressAppIO.sockets.on('connection', (socket) => {
	console.log('Client connected:', socket.id);

    socket.on('authenticate', (token: string) => {
        // Implement your authentication logic here
        const userId = authenticateTokenSocket(token); // Replace with your auth logic
        if (userId) {
            userConnections.set(userId, socket.id);
            fetchUserByID(userId).then((user) => {
                socket.emit('notification', { message: `Authenticated successfully, Welcome to TalOS, ${user?.display_name}.` });
                console.log(`User ${user?.display_name} authenticated with socket ${socket.id}`);
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        userConnections.forEach((socketId, userId) => {
            if (socketId === socket.id) {
                userConnections.delete(userId);
                console.log(`User ${userId} disconnected`);
            }
        });
    });

});

function sendNotificationToUser(userId: string, notification: any) {
    const socketId = userConnections.get(userId);
    if (socketId) {
        expressAppIO.sockets.to(socketId).emit('notification', notification);
    }
}

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

expressApp.post('/files/upload', authenticateToken, upload.single('image'), (req, res) => {
	if (!req.file) {
		return res.status(400).send('No file uploaded.');
	}
	res.send(`File uploaded: ${req.file.originalname}`);
});

const profilePicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profilePicturesPath)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const uploadPfp = multer({ storage: profilePicStorage });

expressApp.post('/pfp/upload', authenticateToken, uploadPfp.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded: ${req.file.originalname}`);
});

expressApp.post('/register', async (req, res) => {
    const { username, password, display_name } = req.body;
    if (!username || !password || !display_name) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    // Check if username already exists
    const checkUserQuery = `SELECT username FROM users WHERE username = ?`;
    db.get(checkUserQuery, [username], async (checkErr: any, row: any) => {
        if (checkErr) {
            res.status(500).json({ error: checkErr.message });
            return;
        }
        if (row) {
            res.status(409).json({ error: 'Username already taken' });
            return;
        }

        // Proceed with registration
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = `INSERT INTO users (username, hashed_password, display_name ) VALUES (?, ?, ?)`;

        db.run(insertQuery, [username, hashedPassword, display_name], function(err: any) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'User registered successfully', id: this.lastID });
        });
    });
});

expressApp.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }
    const query = `SELECT * FROM users WHERE username = ?`;

    db.get(query, [username], async (err: any, user: any) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (user && await bcrypt.compare(password, user.hashed_password)) {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET ?? '', { expiresIn: '24h' });

            // Set cookie with the token
            res.cookie('talosAuthToken', token, {
                httpOnly: false, // Makes the cookie inaccessible to client-side JavaScript
                secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            res.json({ message: 'Login successful' });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

expressApp.post('/logout', (req, res) => {
    res.cookie('talosAuthToken', '', { expires: new Date(0) });
    res.json({ message: 'Logged out successfully' });
});

expressApp.get('/me', authenticateToken, (req, res) => {
    const query = `SELECT id, username, profile_pic, display_name, bio, background_pic, tagline FROM users WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.get(query, [req.user.userId], (err: any, user: any) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(user);
    });
});

// check if a user is logged in
expressApp.get('/isLoggedIn', authenticateToken, (req, res) => {
    res.json({ message: 'Logged in' });
});

// allow a user to change their password
expressApp.post('/changePassword', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const query = `SELECT * FROM users WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.get(query, [req.user.userId], async (err: any, user: any) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (user && await bcrypt.compare(oldPassword, user.hashed_password)) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updateQuery = `UPDATE users SET hashed_password = ? WHERE id = ?`;
            //@ts-expect-error - user is a property of the Request interface
            db.run(updateQuery, [hashedPassword, req.user.userId], function(err: any) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Password changed successfully' });
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

// allow a user to change their profile picture
expressApp.post('/changeProfilePicture', authenticateToken, async (req, res) => {
    const { profilePicture } = req.body;
    if (!profilePicture) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET profile_pic = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [profilePicture, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Profile picture changed successfully' });
    });
});

// allow a user to change their display name
expressApp.post('/changeDisplayName', authenticateToken, async (req, res) => {
    const { displayName } = req.body;
    if (!displayName) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET display_name = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [displayName, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Display name changed successfully' });
    });
});

// allow a user to change their display name
expressApp.post('/changeProfileBackground', authenticateToken, async (req, res) => {
    const { backgroundPic } = req.body;
    if (!backgroundPic) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET background_pic = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [backgroundPic, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Display name changed successfully' });
    });
});

// allow a user to change their tagline
expressApp.post('/changeTagline', authenticateToken, async (req, res) => {
    const { tagline } = req.body;
    if (!tagline) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET tagline = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [tagline, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Display name changed successfully' });
    });
});

// allow a user to change their tagline
expressApp.post('/changeBio', authenticateToken, async (req, res) => {
    const { bio } = req.body;
    if (!bio) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET bio = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [bio, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Display name changed successfully' });
    });
});

// allow unauthenticated users to view a user's profile
expressApp.get('/profile/:id', (req, res) => {
    const id = req.params.id;
    const query = `SELECT id, username, profile_pic, display_name, bio, background_pic, tagline FROM users WHERE id = ?`;

    db.get(query, [id], (err: any, user: any) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(user);
    });
});

async function fetchUserByID(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row || null);
        });
    });
}

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
function fetchAllCharacters(): Promise<CharacterInterface[]> {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM characters', [], (err, rows: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

expressApp.get('/characters', async (req, res) => {
    try {
        const characterData = await fetchAllCharacters();
        res.send(characterData);
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
});

// save a character to the ../data/characters/ folder
function saveOrUpdateCharacter(character: CharacterInterface): Promise<void> {
    return new Promise((resolve, reject) => {
        const upsertQuery = `REPLACE INTO characters (_id, name, avatar, description, personality, mes_example, creator_notes, system_prompt, post_history_instructions, tags, creator, visual_description, thought_pattern, first_mes, alternate_greetings, scenario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(upsertQuery, Object.values(character), (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

expressApp.post('/save/character', authenticateToken, async (req, res) => {
    try {
        await saveOrUpdateCharacter(req.body);
        res.send({ message: "Character saved successfully!" });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
});

// get a character by id from the ../data/characters/ folder
function fetchCharacterById(id: string): Promise<CharacterInterface | null> {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM characters WHERE _id = ?', [id], (err, row: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row || null);
        });
    });
}

expressApp.get('/character/:id', async (req, res) => {
    try {
        const character = await fetchCharacterById(req.params.id);
        if (character) {
            res.send(character);
        } else {
            res.status(404).send({ message: "Character not found" });
        }
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
});

//get characters by creator from the ../data/characters/ folder
function fetchCharactersByCreator(creator: string): Promise<CharacterInterface[]> {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM characters WHERE creator = ?', [creator], (err, rows: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

expressApp.post('/characters/creator', async (req, res) => {
    try {
        const characterData = await fetchCharactersByCreator(req.body.creator);
        res.send(characterData);
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
});

//remove a character by id from the ../data/characters/ folder
function removeCharacterById(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM characters WHERE _id = ?', [id], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

expressApp.delete('/character/:id', authenticateToken, async (req, res) => {
    try {
        await removeCharacterById(req.params.id);
        res.send({ message: "Character removed successfully!" });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
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