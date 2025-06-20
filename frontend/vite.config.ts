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
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      // External packages that should not be bundled
      external: ["crypto"],
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
      // Polyfill Node.js crypto for browser
      crypto: "crypto-browserify",
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
