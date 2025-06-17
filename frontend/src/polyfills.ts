import { Buffer } from 'buffer';

// Polyfill global Buffer
window.Buffer = Buffer;

// Polyfill process.env
if (!window.process) {
  window.process = { env: {} } as any;
}

// Polyfill global crypto
if (typeof window.crypto === 'undefined') {
  window.crypto = require('crypto-browserify');
}
