import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    root: "app",
    publicDir: "public",
    plugins: [tailwindcss()],
    build: {
        outDir: "../dist/app",
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        proxy: {
            "/socket.io": {
                target: "http://localhost:5500",
                ws: true,
                changeOrigin: true,
            },
        },
    },
});
