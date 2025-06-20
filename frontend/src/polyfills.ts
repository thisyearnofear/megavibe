import { Buffer } from 'buffer';
import crypto from 'crypto-browserify';
import { EventEmitter } from 'events';

// Ensure globals are available before any other modules load
(function() {
  // Polyfill global Buffer
  if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
  }

  // Polyfill global EventEmitter
  if (typeof window !== 'undefined' && !window.EventEmitter) {
    window.EventEmitter = EventEmitter;
  }

  // Polyfill process.env with better compatibility
  if (typeof window !== 'undefined' && !window.process) {  
    window.process = { 
      env: {},
      browser: true,
      version: 'v18.0.0',
      nextTick: (fn: Function) => setTimeout(fn, 0)
    } as any;
  }

  // Polyfill global crypto for web3 libraries
  if (typeof window !== 'undefined') {
    // Use native crypto if available, otherwise use polyfill
    if (!window.crypto || !window.crypto.subtle) {
      // @ts-ignore
      window.crypto = crypto;
    }
    
    // Ensure global crypto is available for modules that import it directly
    if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
      globalThis.crypto = window.crypto;
    }
    
    // Make EventEmitter available globally for modules that need it
    if (typeof globalThis !== 'undefined' && !globalThis.EventEmitter) {
      globalThis.EventEmitter = EventEmitter;
    }
    
    // Some libraries expect events module to be available globally
    if (typeof globalThis !== 'undefined' && !globalThis.events) {
      globalThis.events = { EventEmitter };
    }
  }
})();

// Add better error handling for wallet connections
if (typeof window !== 'undefined') {
  // Handle wallet connection errors gracefully
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Filter out common wallet extension errors that are not critical
    const message = args.join(' ');
    if (
      message.includes('Could not establish connection') ||
      message.includes('Receiving end does not exist') ||
      message.includes("Backpack couldn't override window.ethereum") ||
      message.includes('pageProvider.js') ||
      message.includes('Extension context invalidated')
    ) {
      // These are usually harmless extension communication issues
      console.debug('[Wallet Extension - Non-Critical]', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  // Also handle unhandled promise rejections from wallet extensions
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && typeof error === 'object') {
      const message = error.message || error.toString();
      if (
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('Extension context invalidated')
      ) {
        console.debug('[Wallet Extension - Promise Rejection]', error);
        event.preventDefault(); // Prevent the error from showing in console
        return;
      }
    }
  });
}
