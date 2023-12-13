import express from 'express';
import cors from 'cors';
import { createServer } from "node:http";
import { Server, Socket } from 'socket.io';
import multer from 'multer';
import bodyParser from 'body-parser';
import fs from 'fs';

const uploadsPath = './uploads';

export const expressApp = express();
const port = 3003;

fs.mkdirSync(uploadsPath, { recursive: true });
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

expressApp.post('/v1/completions', (req, res) => {
  
});