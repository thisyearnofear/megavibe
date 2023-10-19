// server/middleware/sessionMiddleware.cjs
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// Create a MongoDB session store
const store = new MongoDBStore({
  uri: process.env.MONGO_URI, // Use the same environment variable
  collection: 'megavibesessions',
});

store.on('error', function (error) {
  console.error('MongoDB session store error:', error);
});

// Use express-session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    secure: false, // Set to false when running over HTTP
    // secure: true, // Uncomment this line when running over HTTPS
  },
});

module.exports = {
  store, // Export the store variable
  sessionMiddleware,
};