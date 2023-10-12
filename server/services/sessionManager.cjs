// sessionManager.cjs
const { v4: uuidv4 } = require('uuid');

const activeSessions = {};

function generateSessionId() {
  return uuidv4();
}

function createSession() {
  const sessionId = generateSessionId();
  activeSessions[sessionId] = {}; // Add session data if needed
  return sessionId;
}

function getSession(sessionId) {
  return activeSessions[sessionId];
}

function endSession(sessionId) {
  delete activeSessions[sessionId];
}

module.exports = { createSession, getSession, endSession };
