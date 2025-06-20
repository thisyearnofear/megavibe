import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
    global: "globalThis",
    // Add these for better web3 compatibility
    "process.browser": true,
    "process.version": JSON.stringify("v18.0.0"),
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    assetsInlineLimit: 0, // Don't inline assets, keep them as separate files
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@dynamic-labs') || id.includes('wagmi') || id.includes('viem') || id.includes('ethers')) {
              return 'vendor-web3';
            }
            if (id.includes('@tanstack') || id.includes('axios') || id.includes('gsap')) {
              return 'vendor-ui';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
        },
        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      // Polyfill Node.js modules for browser
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      buffer: "buffer",
      process: "process/browser",
      util: "util",
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-icons/fa',
      'buffer',
      'crypto-browserify',
      'stream-browserify',
      'util',
      'process/browser',
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
  },
});
