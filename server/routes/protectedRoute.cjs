// routes/protectedRoute.js

const express = require('express');
const router = express.Router();

// Middleware to check the session
function checkSession(req, res, next) {
  // Verify the session ID format
// sourcery skip: use-object-destructuring
  const sessionId = req.headers.sessionId;
  if (!sessionId || !isValidUUID(sessionId)) {
    return res.status(401).send('Unauthorized');
  }
  
  // Here, you can perform additional checks to verify if the session is valid

  next();
}

// Helper function to check UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-fA-F]{32}$/;
  return uuidRegex.test(uuid);
}

router.get('/protected', checkSession, (req, res) => {
  console.log('Session Data:', req.session);

  res.json({ message: 'This is a protected route', user: req.session.user });

});

module.exports = router;
