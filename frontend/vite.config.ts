import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": process.env,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      // External packages that should not be bundled
      external: ["crypto"],
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      // Polyfill Node.js crypto for browser
      crypto: "crypto-browserify",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
  },
});
