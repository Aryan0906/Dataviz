import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    server: {
        host: "::",
        port: 5173,
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) return;
                    if (id.match(/react|react-dom|react-router/)) return "react-vendor";
                    if (id.match(/@radix-ui/)) return "radix-ui";
                    if (id.match(/recharts|regression/)) return "charts";
                },
            },
        },
    },
});
