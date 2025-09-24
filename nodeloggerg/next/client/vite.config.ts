import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/nodeloggerg": "http://localhost:3000",
    },
  },
  build: {
    outDir: "../backend/client",
    emptyOutDir: true,
  },
});
