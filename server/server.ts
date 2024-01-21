import express from 'express';
import cors from 'cors';
import { createServer } from "node:http";
import { Server } from 'socket.io';
import multer from 'multer';
import bodyParser from 'body-parser';
import fs from "fs";
import path from "path";
import db, { clearUsers } from './routes/database.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { settingsRouter } from './routes/settings.js';
import { getAllUsers, usersRouter } from './routes/users.js';
import { charactersRouter } from './routes/characters.js';
import { authenticateToken } from './routes/authenticate-token.js';
import { conversationsRouter } from './routes/conversations.js';
import { connectionsRouter } from './routes/connections.js';
import { llmsRouter } from './routes/llms.js';
import { transformersRouter } from './helpers/transformers.js';
import { lorebooksRouter } from './routes/lorebooks.js';
import WebSocket from 'ws';
import { diffusionRouter } from './routes/diffusion.js';
import { discordConfigRoute } from './routes/discordConfig.js';
import { DiscordManagementRouter, startDiscordRoutes } from './routes/discord.js';
import { roomsRouter } from './routes/rooms.js';
import { AppSettingsInterface } from './typings/types.js';

const defaultAppSettings: AppSettingsInterface = {
    defaultConnection: "",
    defaultSettings: "1",
    admins: ['1'],
    enableCaptioning: false,
    enableEmbedding: false,
    enableQuestionAnswering: false,
    enableZeroShotClassification: false,
    enableYesNoMaybe: false,
    defaultDiffusionConnection: "",
    jwtSecret: ""
};

let dev = false;
let useVarFolder = false;
const args = process.argv.slice(2);

args.forEach(arg => {
    if (arg.startsWith('--dev')) {
        dev = true;
    }
    if (arg.startsWith('--linux-server')) {
        useVarFolder = true;
        console.log("Using /var/local for data storage");
    }
});

const __dirname = path.resolve();
//get the userData directory
const appDataDir = process.env.APPDATA || 
                   (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : 
                   (useVarFolder ? '/var/local' : process.env.HOME + '/.local/share'));//get the talos directory
const talosDir = path.join(appDataDir, 'TalOS');
//get the uploads directory
fs.mkdirSync(talosDir, { recursive: true });

// get the paths for the files and directories
export const appSettingsPath = path.join(talosDir, "/appSettings.json");
export const discordSettingsPath = path.join(talosDir, "/discordSettings.json");
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
export const datasetsPath = `${dataPath}/datasets`;
export const roomsPath = `${dataPath}/rooms`;
export const diffusionConnectionsPath = `${dataPath}/diffusion_connections`;
export const discordConfigPath = path.join(talosDir, "/discordConfigs");
export const defaultBackgroundsPath = path.join(__dirname, "/defaults/backgrounds");
// create the directories if they don't exist
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
fs.mkdirSync(diffusionConnectionsPath, { recursive: true });
fs.mkdirSync(discordConfigPath, { recursive: true });
fs.mkdirSync(roomsPath, { recursive: true });
fs.mkdirSync(defaultBackgroundsPath, { recursive: true });
fs.mkdirSync(spritesPath, { recursive: true });
fs.mkdirSync(modelsPath, { recursive: true });
fs.mkdirSync(wasmPath, { recursive: true });
fs.mkdirSync(imagesPath, { recursive: true });
fs.mkdirSync(datasetsPath, { recursive: true });

// create the express apps
const port = 3003;

let appSettings = { ...defaultAppSettings };

let discordSettings: DiscordGlobalConfig = {
    currentConfig: "",
    autoRestart: false,
};

export interface DiscordGlobalConfig {
    currentConfig: string;
    autoRestart: boolean;
}

if(!fs.existsSync(discordSettingsPath)) {
    fs.writeFileSync(discordSettingsPath, JSON.stringify(discordSettings));
}

if(fs.existsSync(discordSettingsPath)) {
    try {
        const settingsData = fs.readFileSync(discordSettingsPath, 'utf8');
        if (settingsData) {
            //merge the default settings with the settings from the file
            discordSettings = { ...discordSettings, ...JSON.parse(settingsData) };
        } else {
            console.error('Discord settings file is empty. Using default settings.');
        }
    } catch (err) {
        console.error('Error parsing discord settings file. Using default settings.', err);
    }
}

// Check if app settings file exists
if (fs.existsSync(appSettingsPath)) {
    try {
        const settingsData = fs.readFileSync(appSettingsPath, 'utf8');
        if (settingsData) {
            //merge the default settings with the settings from the file
            appSettings = { ...defaultAppSettings, ...JSON.parse(settingsData) };
        } else {
            console.error('App settings file is empty. Using default settings.');
        }
    } catch (err) {
        console.error('Error parsing app settings file. Using default settings.', err);
    }
}
fs.writeFileSync(appSettingsPath, JSON.stringify(appSettings));
fs.writeFileSync(discordSettingsPath, JSON.stringify(discordSettings));
export let JWT_SECRET = appSettings.jwtSecret;
if((JWT_SECRET.trim() === "") || (JWT_SECRET === undefined) || (JWT_SECRET === null)) {
    const generateSecret = () => crypto.randomBytes(64).toString('hex');
    const secret = generateSecret()
    appSettings.jwtSecret = secret;
    JWT_SECRET = secret;
    clearUsers();
    console.log("JWT secret not found. Generated new secret.");
}

async function main(){
    const expressApp = express();
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
    expressApp.use('/backgrounds', express.static(backgroundsPath), express.static(defaultBackgroundsPath));
    expressApp.use('/sprites', express.static(spritesPath));
    expressApp.use(express.static(path.join(__dirname, '../dist-react')));
    const server = createServer(expressApp);

    let userConnections: UserConnection[] = []

    interface UserConnection {
        userId: string;
        socketId: string;
    }

    const expressAppIO = new Server(server, {
        cors: corsOptions
    });
    fs.writeFileSync(appSettingsPath, JSON.stringify(appSettings));
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
        socket.on('authenticate', (token: string) => {
            // Implement your authentication logic here
            const userId = authenticateTokenSocket(token); // Replace with your auth logic
            if (userId) {
                userConnections.push({ userId: userId, socketId: socket.id });
                fetchUserByID(userId).then((user) => {
                    socket.emit('notification', { message: `Authenticated successfully, Welcome to TalOS, ${user?.display_name}.` });
                    console.log(`User ${user?.display_name} authenticated with socket ${socket.id}`);
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            userConnections = userConnections.filter((user) => user.socketId !== socket.id);
        });

    });

    function sendNotificationToUser(userId: string, notification: any) {
        const socketId = userConnections.find((user) => user.userId === userId)?.socketId;
        if (socketId) {
            expressAppIO.sockets.to(socketId).emit('notification', notification);
        }
    }

    function sendNotificationToAll(notification: any) {
        expressAppIO.sockets.emit('notification', notification);
    }

    function sendNotificationToAllExcept(userId: string, notification: any) {
        userConnections.forEach((user) => {
            if (user.userId !== userId) {
                expressAppIO.sockets.to(user.socketId).emit('notification', notification);
            }
        });
    }

    // create a function that gets all of the profile data for connected users
    function getConnectedUsers() {
        const connectedUsers: any[] = [];
        userConnections.forEach((user) => {
            connectedUsers.push(user.userId);
        });
        return connectedUsers;
    }

    server.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`);
        console.log(`Frontend runs by default on http://localhost:5173`);
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
    expressApp.get('/api/background/all', authenticateToken, async (req, res) => {
        try {
            const filesArr: string[] = [];
            const files = fs.readdirSync(backgroundsPath);
            files.forEach((file) => {
                filesArr.push(file);
            });
            const defaultFiles = fs.readdirSync(defaultBackgroundsPath);
            defaultFiles.forEach((file) => {
                filesArr.push(file);
            });
            res.send(filesArr);
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

    expressApp.get('/api/stats/users', async (req, res) => {
        const users = await getAllUsers();
        res.json({ users: users, activeUsers: userConnections });
    });

    expressApp.use('/api', settingsRouter);
    expressApp.use('/api', usersRouter);
    expressApp.use('/api', charactersRouter);
    expressApp.use('/api', conversationsRouter);
    expressApp.use('/api', connectionsRouter);
    expressApp.use('/api', llmsRouter);
    expressApp.use('/api', lorebooksRouter);
    expressApp.use('/api/transformers', transformersRouter);
    expressApp.use('/api', diffusionRouter);
    expressApp.use('/api', discordConfigRoute);
    expressApp.use('/api/discordManagement', DiscordManagementRouter)
    expressApp.use('/api/rooms', roomsRouter);
    startDiscordRoutes();

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

    expressApp.use('*', (req, res) => res.sendFile(path.join(__dirname, '../dist-react', 'index.html')));
}

// eslint-disable-next-line no-constant-condition
while(true){
    try{
        main();
        break;
    }catch(err){
        console.log(err);
    }
}

//make it so when the terminal is closed, the server is closed
process.on('SIGINT', () => {
    process.exit();
});

process.on('SIGTERM', () => {
    process.exit();
});

process.on('exit', () => {
    process.exit();
});