// server/middleware/sessionMiddleware.cjs

const dotenv = require('dotenv');

const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const store = process.env.NODE_ENV === 'test' ? new MemoryStore() : new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'megavibesessions',
});

store.on('error', function (error) {
  console.error('MongoDB session store error:', error);
});

// Determine the secure option based on the environment
const isProduction = process.env.NODE_ENV === 'production';
const secureOption = isProduction; // Only set secure to true in production

const cookieConfig = require('../config/cookieConfig.cjs'); // Import the cookie configuration

// Use express-session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: store,
  cookie: cookieConfig, 

});

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET);

module.exports = {
  store,
  sessionMiddleware,
};