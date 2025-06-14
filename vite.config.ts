import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./frontend",
  plugins: [react()],
  define: {
    "process.env": process.env,
  },
  build: {
    outDir: "dist",
  },
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
