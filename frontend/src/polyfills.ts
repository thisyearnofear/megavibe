import { Buffer } from 'buffer';
import crypto from 'crypto-browserify';

// Ensure globals are available before any other modules load
(function() {
  // Polyfill global Buffer
  if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
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
  if (typeof window !== 'undefined' && (typeof window.crypto === 'undefined' || !window.crypto.subtle)) {
    // @ts-ignore
    window.crypto = crypto;
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
      message.includes("Backpack couldn't override window.ethereum")
    ) {
      console.warn('[Wallet Extension]', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}
