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
import { settingsRouter } from './settings.js';
import { usersRouter } from './users.js';
import { charactersRouter } from './characters.js';
import { authenticateToken } from './authenticate-token.js';
import { conversationsRouter } from './conversations.js';
import { connectionsRouter } from './connections.js';
import { llmsRouter } from './llms.js';
import { transformersRouter } from './helpers/transformers.js';
dotenv.config();

export const uploadsPath = './uploads';
export const dataPath = './data';
export const modelsPath = './models';
export const wasmPath = './wasm';
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

export const JWT_SECRET = process.env.JWT_SECRET

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
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
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

const backgroundStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, backgroundsPath)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const uploadBackground = multer({ storage: backgroundStorage });

expressApp.post('/background/upload', authenticateToken, uploadBackground.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded: ${req.file.originalname}`);
});

expressApp.post('/background/delete', authenticateToken, (req, res) => {
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
expressApp.post('/background/rename', authenticateToken, (req, res) => {
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
expressApp.get('/background/all', authenticateToken, (req, res) => {
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

expressApp.post('/pfp/upload', authenticateToken, uploadPfp.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded: ${req.file.originalname}`);
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


expressApp.use(settingsRouter);
expressApp.use(usersRouter);
expressApp.use(charactersRouter);
expressApp.use(conversationsRouter);
expressApp.use(connectionsRouter);
expressApp.use(llmsRouter);
expressApp.use('/transformers', transformersRouter);