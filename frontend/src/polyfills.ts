import { Buffer } from 'buffer';
import crypto from 'crypto-browserify';
import { EventEmitter } from 'events';

// Ensure globals are available before any other modules load
(function() {
  try {
    // Polyfill global Buffer
    if (typeof window !== 'undefined' && !window.Buffer) {
      window.Buffer = Buffer;
    }

    // Polyfill global EventEmitter
    if (typeof window !== 'undefined' && !window.EventEmitter) {
      window.EventEmitter = EventEmitter;
    }

    // Polyfill import.meta.env with better compatibility
    if (typeof window !== 'undefined' && !window.process) {  
      window.process = { 
        env: {},
        browser: true,
        version: 'v18.0.0',
        nextTick: (fn: Function) => {
          try {
            setTimeout(fn, 0);
          } catch (e) {
            console.error('nextTick error:', e);
          }
        }
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
  } catch (error) {
    console.error('Polyfill initialization error:', error);
    // Don't let polyfill errors break the app
  }
})();

// Prevent wallet extension errors from breaking the app
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections from wallet extensions
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && typeof error === 'object') {
      const message = error.message || error.toString();
      if (
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('Extension context invalidated') ||
        message.includes('pageProvider.js')
      ) {
        // Prevent these wallet extension errors from breaking the app
        event.preventDefault();
        console.debug('[Wallet Extension Error - Handled]', error);
        return;
      }
    }
  });

  // Handle general JavaScript errors
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (
      message.includes('pageProvider.js') ||
      message.includes('extension') ||
      event.filename?.includes('extension')
    ) {
      // Prevent extension-related errors from breaking the app
      event.preventDefault();
      console.debug('[Extension Error - Handled]', event);
      return;
    }
  });
}
