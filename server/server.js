import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import app from './app.js';
import connectDB from './config/db.js';
import documentSocket from './sockets/documentSocket.js';

dotenv.config();

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

documentSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});