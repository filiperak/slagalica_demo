import App from "./App.js";

const PORT = 5500;
const isLocal =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const ioUrl = isLocal ? `ws://localhost:${PORT}` : "https://slagalica-demo.onrender.com";

console.log("Connecting to:", ioUrl);

window.addEventListener("DOMContentLoaded", () => {
    const app = new App(ioUrl);
    app.init();
});
