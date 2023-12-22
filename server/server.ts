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
import db from './routes/database.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { AppSettingsInterface, settingsRouter } from './routes/settings.js';
import { getAllUsers, usersRouter } from './routes/users.js';
import { charactersRouter } from './routes/characters.js';
import { authenticateToken } from './routes/authenticate-token.js';
import { conversationsRouter } from './routes/conversations.js';
import { connectionsRouter } from './routes/connections.js';
import { llmsRouter } from './routes/llms.js';
import { transformersRouter } from './helpers/transformers.js';
import { lorebooksRouter } from './routes/lorebooks.js';
import WebSocket from 'ws';

const __dirname = path.resolve();
//get the userData directory
const appDataDir = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local');
//get the talos directory
const talosDir = path.join(appDataDir, 'TalOS');
//get the uploads directory
fs.mkdirSync(talosDir, { recursive: true });
export const appSettingsPath = path.join(talosDir, "/appSettings.json");

function checkForAppSettings() {
    return new Promise((resolve, reject) => {
        fs.access(appSettingsPath, fs.constants.F_OK, (err) => {
            if (err) {
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}

const defaultAppSettings: AppSettingsInterface = {
    defaultConnection: "",
    defaultSettings: "1",
    admins: ['1'],
    enableCaptioning: false,
    enableEmbedding: false,
    enableQuestionAnswering: false,
    enableZeroShotClassification: false,
    enableYesNoMaybe: false,
    jwtSecret: "",
};

checkForAppSettings().then((exists) => {
    if (!exists) {
        fs.writeFile(appSettingsPath, JSON.stringify(defaultAppSettings), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('App settings file created');
        });
    }
});

export const uploadsPath = path.join(talosDir, '/uploads');
export const dataPath = path.join(talosDir, '/data');
export const modelsPath = path.join(talosDir, '/models');
export const wasmPath = path.join(talosDir, '/wasm');
export const imagesPath = `${dataPath}/images`;
export const profilePicturesPath = `${dataPath}/profile_pictures`;
export const backgroundsPath = `${dataPath}/backgrounds`;
export const spritesPath = `${dataPath}/sprites`;
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

let dev = false;

const args = process.argv.slice(2);

args.forEach(arg => {
    if (arg.startsWith('--dev')) {
        dev = true;
    }
});

const appSettings: AppSettingsInterface = JSON.parse(fs.readFileSync(appSettingsPath, 'utf-8'));

export let JWT_SECRET = appSettings.jwtSecret;

if(!JWT_SECRET) {
    const generateSecret = () => crypto.randomBytes(64).toString('hex');
    const secret = generateSecret()
    appSettings.jwtSecret = secret;
    fs.writeFileSync(appSettingsPath, JSON.stringify(appSettings));
    JWT_SECRET = secret;
}

fs.mkdirSync(uploadsPath, { recursive: true });
fs.mkdirSync(profilePicturesPath, { recursive: true });
fs.mkdirSync(backgroundsPath, { recursive: true });
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
expressApp.use('/backgrounds', express.static(backgroundsPath));
expressApp.use('/sprites', express.static(spritesPath));

const server = createServer(expressApp);

const userConnections = new Map<string, string>();

export const expressAppIO = new Server(server, {
	cors: corsOptions
});

// Graceful shutdown function
function gracefulShutdown() {
	console.log('Shutting down gracefully...');
    process.exit(0);
}

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

function sendNotificationToAll(notification: any) {
    expressAppIO.sockets.emit('notification', notification);
}

function sendNotificationToAllExcept(userId: string, notification: any) {
    userConnections.forEach((socketId, id) => {
        if (id !== userId) {
            expressAppIO.sockets.to(socketId).emit('notification', notification);
        }
    });
}

// create a function that gets all of the profile data for connected users
function getConnectedUsers() {
    const connectedUsers: any[] = [];
    userConnections.forEach((socketId, userId) => {
        connectedUsers.push(userId);
    });
    return connectedUsers;
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

expressApp.post('/api/files/upload', authenticateToken, upload.single('image'), (req, res) => {
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

const backgroundStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, backgroundsPath)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const uploadBackground = multer({ storage: backgroundStorage });

expressApp.post('/api/background/upload', authenticateToken, uploadBackground.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded: ${req.file.originalname}`);
});

expressApp.post('/api/background/delete', authenticateToken, (req, res) => {
    try {
        const filename = req.body.filename;
        const path = `${backgroundsPath}/${filename}`;
        fs.unlink(path, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send(err);
            }
            res.send(`File deleted: ${filename}`);
        });
    } catch (error) {
        console.log(error);
    }
});

// rename background
expressApp.post('/api/background/rename', authenticateToken, (req, res) => {
    try{
        const oldFilename = req.body.oldFilename;
        const newFilename = req.body.newFilename;
        const oldPath = `${backgroundsPath}/${oldFilename}`;
        const newPath = `${backgroundsPath}/${newFilename}`;
        fs.rename(oldPath, newPath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send(err);
            }
            res.send(`File renamed: ${oldFilename} to ${newFilename}`);
        });
    }catch(err){
        console.log(err);
    }
});

// get all image file names in backgrounds folder
expressApp.get('/api/background/all', authenticateToken, (req, res) => {
    try {
        fs.readdir(backgroundsPath, (err, files) => {
            if (err) {
                console.error(err);
                return res.status(500).send(err);
            }
            res.send(files);
        });
    } catch (error) {
        console.log(error);
    }
});

expressApp.post('/api/pfp/upload', authenticateToken, uploadPfp.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded: ${req.file.originalname}`);
});

expressApp.post('/api/upload/sprite', authenticateToken, upload.single('sprite'), (req, res) => {
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).send('No file uploaded');
    }
    try {
        const { emotion, characterid } = req.body;
        const filename = `${emotion}.png`;
        const oldPath = req.file.path;
        const newPath = `${spritesPath}/${characterid}/${filename}`;

        fs.mkdirSync(`${spritesPath}/${characterid}`, { recursive: true });
        fs.renameSync(oldPath, newPath);
        
        console.log(`File uploaded: ${filename}`);
        res.send(`File uploaded: ${filename}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading file');
    }
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

function getActiveUsers() {
    const activeUsers: any[] = [];
    userConnections.forEach((socketId, userId) => {
        activeUsers.push(userId);
    });
    const userDetails: any[] = [];
    activeUsers.forEach((userId) => {
        fetchUserByID(userId).then((user) => {
            userDetails.push(user);
        });
    });
    return userDetails;
}

expressApp.get('/api/stats/users', authenticateToken, async (req, res) => {
    const users = await getAllUsers();
    const activeUsers = getActiveUsers();
    res.json({ users: users, activeUsers: activeUsers });
});

expressApp.use('/api', settingsRouter);
expressApp.use('/api', usersRouter);
expressApp.use('/api', charactersRouter);
expressApp.use('/api', conversationsRouter);
expressApp.use('/api', connectionsRouter);
expressApp.use('/api', llmsRouter);
expressApp.use('/api', lorebooksRouter);
expressApp.use('/api/transformers', transformersRouter);

function checkIfTauriAppIsOpen() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.on('open', function open() {
            console.log('Tauri app is open');
            ws.close();
            resolve(true);
        });

        ws.on('error', function error() {
            console.log('Tauri app is not open');
            resolve(false);
        });
    });
}
let numberOfTries = 0;

expressApp.use(express.static(path.join(__dirname, '../dist-react')));

expressApp.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist-react', 'index.html'));
});



if(!dev){
    setInterval(() => {
        checkIfTauriAppIsOpen().then((isOpen) => {
            numberOfTries++;
            if (!isOpen && numberOfTries > 15) {
                console.log("Tauri app is not running. Exiting Node.js server.");
                process.exit(1);
            }
        });
    }, 5000);
}