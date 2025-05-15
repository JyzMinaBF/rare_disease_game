import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// build 後把 dist 複製進 backend/game
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../backend/game",
    emptyOutDir: true     
  },
  resolve: { alias: { "@": resolve(__dirname, "src") } }
});
