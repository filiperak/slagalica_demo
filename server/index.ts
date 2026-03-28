import express from "express";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { SocketHandler } from "./SocketHandler.js";
import cors from "cors";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5500;

const app = express();
app.use(cors());

// Resolve correct static folder for both dev (running TS from repo)
// and production (running compiled JS from dist).
const candidates = [path.join(__dirname, "../dist/app"), path.join(__dirname, "../app")];
const staticFolder = candidates.find((p) => fs.existsSync(p)) || candidates[0];
console.log(`Serving static files from: ${staticFolder}`);
app.use(express.static(staticFolder));

const expressServer = app.listen(PORT, () => {
    console.log(`App is running on ${PORT}`);
});

const io = new Server(expressServer, {
    cors: {
        origin: "*",
        // origin: process.env.NODE_ENV === "production"?
        // "https://slagalica-demo.onrender.com" :
        //  ["http://localhost:5500","http://127.0.0.1:5500"]
    },
});
// const io = new Server(expressServer)

//init socket logic
new SocketHandler(io);
