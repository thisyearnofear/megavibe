const dotenv = require('dotenv');

const express = require('express');
const router = express.Router();
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const store = new MongoDBStore({
  uri: process.env.MONGO_URI, // Your MongoDB connection string
  collection: 'sessions', // Collection name for sessions
});

// Handle store errors
store.on('error', (error) => {
  console.error('MongoDB session store error:', error);
});

// Express session middleware
router.use(
  session({
    secret: process.env.SESSION_SECRET, // Secret for session management
    resave: false,
    saveUninitialized: false,
    store: store, // Use the MongoDB session store
    cookie: {
      secure: true, // Set to true when running over HTTPS
    },
  })
);

// Create a new session
router.post('/api/create-session', (req, res) => {
    try {
      // If 'userId' is provided in the request body, associate it with the session
      if (req.body.userId) {
        req.session.userId = req.body.userId;
        console.log('Session created with userId:', req.body.userId);
      }
  
      // Create a sessionId property in the response
      const sessionId = req.sessionID; 
      console.log('Session ID:', sessionId);
  
      res.status(201).json({ sessionId, message: 'Session created' });
    } catch (error) {
        console.error('Error creating session:', error);
      handleError(res, { statusCode: 400, message: 'Bad Request' });
    }
  });
  
// Retrieve a specific session
router.get('/api/retrieve-session', (req, res) => {
    try {
      const { userId } = req.session;
  
      if (userId) {
        res.json({ userId });
      } else {
        handleError(res, { statusCode: 404, message: 'Session not found' });
      }
    } catch (error) {
      handleError(res, { statusCode: 500, message: 'Internal server error' });
    }
  });
  
// Delete a specific session
router.delete('/api/sessions/:id', (req, res) => {
    try {
      if (req.session) {
        req.session.destroy((error) => {
          if (error) {
            console.error('Error ending session:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }
          return res.json({ message: 'Session ended' });
        });
      } else {
        res.status(404).json({ message: 'Session not found' });
      }
    } catch (error) {
      console.error('Error ending session:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

  router.get('/api/server-error', (req, res) => {
    // Simulate a server error (e.g., accessing an undefined variable)
    try {
      undefinedVariable; // This will trigger a ReferenceError
    } catch (error) {
      handleError(res, { statusCode: 500, message: 'Internal server error' });
    }
  });

router.get('/api/invalid-session', (req, res) => {
    try {
      // Simulate an invalid session ID by trying to retrieve a non-existent session
      // You can respond with an error message
      handleError(res, { statusCode: 500, message: 'Invalid session ID' });
    } catch (error) {
      handleError(res, { statusCode: 500, message: 'Internal server error' });
    }
  });
  
  
  module.exports = router;
