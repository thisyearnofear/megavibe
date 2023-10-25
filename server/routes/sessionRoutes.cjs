// server/routes/sessionRoutes.cjs
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const router = express.Router();
const { handleError } = require('../utils/errorHandler.cjs');

const { createSession, retrieveSession, endSession } = require('../controllers/sessionController.cjs');

// Create a new session
router.post('/api/create-session', createSession);

// Retrieve a specific session
router.get('/api/retrieve-session', retrieveSession);

// Delete a specific session
router.delete('/api/sessions/:id', endSession);

router.get('/api/server-error', (req, res) => {
  try {
    undefinedVariable; // This will trigger a ReferenceError
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/api/invalid-session', (req, res) => {
  // Simulate an invalid session ID by trying to retrieve a non-existent session
  const error = new Error('Invalid session ID');
  error.statusCode = 401;
  handleError(res, error);
});

module.exports = router;