import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./frontend/src",
  plugins: [react()],
  define: {
    "process.env": process.env,
  },
  build: {
    outDir: "build", // Add this line
  },
});
