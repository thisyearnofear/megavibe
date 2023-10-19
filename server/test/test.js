// server/test/test.js

const assert = require('assert');
const sessionManager = require('../services/sessionManager.cjs');

describe ('Session Manager', () => {
  it('should create a session', async () => { // Add async here
    // Create a sample user data to store in the session
    const userData = {}; // No "name" or "email" properties
  
    // Create a session and get the session ID
    const sessionId = await sessionManager.createSession(userData); // Add await here
  
    // Verify that the session ID is a valid UUID
    // We can use a regular expression to check if it's in the UUID format
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    assert(uuidPattern.test(sessionId), 'Invalid session ID format');
  
    // Retrieve the session data
    const retrievedUserData = await sessionManager.getSession(sessionId); // Add await here
  
    // Verify that the retrieved user data is an empty object
    assert.deepStrictEqual(retrievedUserData, userData);
  
    // Clean up: Remove the session
    await sessionManager.endSession(sessionId); // Add await here
  });

})