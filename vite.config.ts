import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ command }) => ({
  // Use /song-builder/ base only for production builds (GitHub Pages deployment).
  // In dev mode (including Playwright tests) use the root base so tests can
  // navigate to absolute paths like /image without a prefix.
  base: command === "build" ? "/song-builder/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
