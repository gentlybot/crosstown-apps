import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// VITE_BASE_PATH lets the sandbox serve the app under /courier/ beside the
// portal. Native builds and local dev use "/".
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    host: true,
    port: 5300,
    strictPort: true,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS ? process.env.VITE_ALLOWED_HOSTS.split(",").map((h) => h.trim()) : undefined,
  },
});
