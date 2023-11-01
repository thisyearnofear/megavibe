// Import express-session
const session = require('express-session');

// Initialize an in-memory cache
const sessionCache = new Map();

// Middleware to verify the session
const verifySession = (req, res, next) => {
  try {
    const sessionId = req.sessionID; // Access the session ID from the request

    // Check if the session data is already in the cache
    if (sessionCache.has(sessionId)) {
      req.session = sessionCache.get(sessionId);
      return next();
    }

    // If you don't find it in the cache, the session is managed by express-session

    // You can use `req.session` directly, and if it's not present, it means there's no session.

    next();
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = verifySession;
