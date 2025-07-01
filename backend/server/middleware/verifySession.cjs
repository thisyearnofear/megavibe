// Import express-session
const session = require('express-session');

// Initialize an in-memory cache
const sessionCache = new Map();

// Middleware to verify the session
const verifySession = (req, res, next) => {
  try {
    // For hackathon demo: simplified session verification
    // Check for session ID in header or session
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    
    if (!sessionId) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No session ID provided' 
      });
    }

    // Check if the session data is already in the cache
    if (sessionCache.has(sessionId)) {
      req.session = sessionCache.get(sessionId);
      req.user = req.session.user;
      return next();
    }

    // Check express-session for active session
    if (req.session && req.session.user) {
      // Cache the session for performance
      sessionCache.set(sessionId, req.session);
      req.user = req.session.user;
      return next();
    }

    // No valid session found
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired session' 
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Session verification failed' 
    });
  }
};

module.exports = verifySession;
