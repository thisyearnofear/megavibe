require('dotenv').config();

// server/middleware/sessionMiddleware.cjs
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

// Create a MongoDB session store
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'megavibesessions',
});

store.on('error', function (error) {
  console.error('MongoDB session store error:', error);
});

// Determine the secure option based on the environment
const isProduction = process.env.NODE_ENV === 'production';
const secureOption = !!isProduction;

// Use express-session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,          // Update this line
  saveUninitialized: false, // Update this line
  store: store,
  cookie: {
    secure: secureOption,
    maxAge: 1000 * 60 * 60,
  },
});

module.exports = {
  store,
  sessionMiddleware,
};