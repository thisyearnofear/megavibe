// server/test/test.js

const assert = require('assert');
const sessionManager = require('../services/sessionManager.cjs');

describe ('Session Manager', () => {
  it('should create a session', () => {
    // Create a sample user data to store in the session
    const userData = {}; // No "name" or "email" properties
  
    // Create a session and get the session ID
    const sessionId = sessionManager.createSession(userData);
  
    // Verify that the session ID is a valid UUID
    // We can use a regular expression to check if it's in the UUID format
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    assert(uuidPattern.test(sessionId), 'Invalid session ID format');
  
    // Retrieve the session data
    const retrievedUserData = sessionManager.getSession(sessionId);
  
    // Verify that the retrieved user data is an empty object
    assert.deepStrictEqual(retrievedUserData, userData);
  
    // Clean up: Remove the session
    sessionManager.endSession(sessionId);
  });

})
