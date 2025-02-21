import express from "express"
import { Server } from "socket.io";
import path from "path"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import handleSocket from "./socket/socket.js";
import cors from "cors"


dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500

const app = express()
app.use(cors())
app.use(express.static(path.join(__dirname,"public")))

const expressServer = app.listen(PORT,() => {
    console.log(`App is running on ${PORT}`);  
})

// const io = new Server(expressServer,{
//     cors:{
//         // origin: process.env.NODE_ENV === "production"?
//         // false : ["http://localhost:5500","http://127.0.0.1:5500"]
//         origin:["*"]
//     }
// })
const io = new Server(expressServer)

//init socket logic
handleSocket(io)