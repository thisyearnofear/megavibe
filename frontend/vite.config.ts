import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
    global: "globalThis",
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 800, // More reasonable limit
    assetsInlineLimit: 4096, // Inline small assets (4KB)
    sourcemap: false, // Disable sourcemaps for production
    rollupOptions: {
      external: ["crypto", "vm"],
      output: {
        // More granular chunk splitting for better caching
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') && !id.includes('react-icons')) {
              return 'vendor-react';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Web3 libraries - split into smaller chunks
            if (id.includes('@dynamic-labs')) {
              return 'vendor-dynamic';
            }
            if (id.includes('wagmi') || id.includes('@wagmi')) {
              return 'vendor-wagmi';
            }
            if (id.includes('viem')) {
              return 'vendor-viem';
            }
            if (id.includes('ethers')) {
              return 'vendor-ethers';
            }
            // UI libraries
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('gsap')) {
              return 'vendor-gsap';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-http';
            }
            if (id.includes('socket.io')) {
              return 'vendor-socket';
            }
            // Crypto and Node polyfills
            if (id.includes('crypto-browserify') || id.includes('stream-browserify') || 
                id.includes('buffer') || id.includes('process')) {
              return 'vendor-polyfills';
            }
            // Everything else
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
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
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
  },
});
