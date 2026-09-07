import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const base = (process.env.VITE_BASE_PATH ?? "/").replace(/\/$/, "") || "/";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    // Generates src/routeTree.gen.ts from src/routes/. Must run before react().
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: true,
    port: 5200,
    strictPort: true,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(",").map((h) => h.trim())
      : undefined,
  },
});
