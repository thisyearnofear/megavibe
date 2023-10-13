//services/sessionManager.cjs

const { v4: uuidv4 } = require('uuid');

// Define session manager object
const sessionManager = {

  // Store active sessions
  activeSessions: {},

  // Generate a new session ID
  generateSessionId() {
    return uuidv4(); 
  },

  // Create a new session
  createSession() {
    const sessionId = this.generateSessionId();
    this.activeSessions[sessionId] = {};
    return sessionId;
  },

  // Get an existing session
  getSession(sessionId) {
    return this.activeSessions[sessionId];
  },

  // Delete a session
  endSession(sessionId) {
    delete this.activeSessions[sessionId];
  }
};

// Export session manager object
module.exports = sessionManager;
