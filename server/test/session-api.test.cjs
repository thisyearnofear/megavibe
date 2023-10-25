// test/session-api.test

require('../../loadEnvVars.cjs');

const request = require('supertest');
const server = require('../../jest.setup.cjs');

const session = require('express-session');

const {
    createNewSession,
    renewSession,
    endSession,
    retrieveSessionData,
    modifySessionData,
    checkSessionExpiry,
    simulateInvalidSession,
} = require('./utils/session-utils.cjs');

function getSessionIdFromCookie(response) {
    const cookies = response.headers['set-cookie'];
    return parseSessionIdFromCookie(cookies);
}

function parseSessionIdFromCookie(cookies) {
    // If there are cookies in the response headers
    if (Array.isArray(cookies) && cookies.length > 0) {
        // Parse the cookie string and extract the session ID
        const cookieString = cookies.join('; ');
        const match = /sessionId=([^;]+)/.exec(cookieString);

        if (match && match[1]) {
            return match[1];
        }
    }

    // Return null or handle the case when no session ID is found
    return null;
}

describe('Session API', () => {

    it('should create a new session and return the session ID', async () => {
        const createRes = await request(server)
            .post('/api/create-session')
            .send({ userId: '123' })
            .expect(200);

        console.log('Session Creation Status:', createRes.status);
        console.log('Response Headers:', createRes.headers);

        if (createRes.status === 200 || createRes.status === 201) {
            // Session creation was successful
            // Extract the session ID from the response cookie
            const sessionCookie = createRes.headers['set-cookie'][0];
            const sessionId = /sessionId=([^;]+)/.exec(sessionCookie)[1];

            // Store the session ID for later use
            const session = { sessionId, cookie: sessionCookie };
            // You can use `session` to retrieve the specific session in the next test

            // Assert that the response contains a session ID
            expect(sessionId).toBeDefined();
        } else {
            console.error('Session creation failed. Check your session creation logic.');
        }
    });

    it('should retrieve a specific session', async () => {
      // Create a new session and extract sessionId and cookie
      const sessionData = { userId: '123' };
      const { sessionId, cookie } = await createNewSession(server, sessionData);
    
      // Retrieve the session
      const res = await request(server)
        .get('/api/retrieve-session')
        .set('Cookie', cookie)
        .expect(200);
    
      // Assert that the response contains the correct session ID and session data
      expect(res.body).toHaveProperty('sessionId', sessionId);
      expect(res.body).toHaveProperty('sessionData', sessionData);
    }); 

    it('should fail to retrieve a non-existent session', async () => {
      // Set a non-existent session ID
      const nonExistentSessionId = 'non-existent-session-id';
    
      const res = await request(server)
        .get('/api/retrieve-session')
        .set('Cookie', `sessionId=${nonExistentSessionId}`)
        .expect(404); // Expect a 404 status code
    
      // Assert that the response contains an error message indicating a non-existent session
      expect(res.body).toHaveProperty('message', 'Session not found');
    });

  it('should handle server errors when retrieving a session', async () => {
    const res = await request(server)
      .get('/api/server-error')
      .expect(500); // Expect a 500 status code
  
    // Assert that the response contains an error message
    expect(res.body).toHaveProperty('message', 'Internal server error');
  });  

  it('should create a new session without a user ID and return the session ID', async () => {
    const res = await request(server)
      .post('/api/create-session')
      .send({})
      .expect(201); // Assuming you use 201 for session creation

    // Assert that the response contains a session ID
    expect(res.body).toHaveProperty('sessionId');
  });
});

it('should handle invalid session IDs', async () => {
    // Send a request to the invalid session route
    const res = await request(server)
      .get('/api/invalid-session')
      .expect(500); // Expect a 500 status code
  
    // Assert that the response contains an error message indicating an invalid session
    expect(res.body).toHaveProperty('message', 'Invalid session ID');
  });
  

  it('should renew an active session', async () => {
    // Create a new session
    const createRes = await request(server)
      .post('/api/create-session')
      .send({ userId: '123' });
     console.log(createRes.status); 
  
    // Extract the session ID from the response cookie
    const sessionId = getSessionIdFromCookie(createRes);
  
    // Check if 'set-cookie' is defined in the headers
    if (createRes.headers['set-cookie']) {
        // Attempt to renew the session
        const renewRes = await request(server)
          .post('/api/renew-session')
          .set('Cookie', createRes.headers['set-cookie'])
          .expect(200);
  
        // Assert the session ID remains unchanged
        expect(getSessionIdFromCookie(renewRes)).toBe(sessionId);
  
        // Additional assertions:
        // - Check the updated expiration date in the session store
        // - Verify that session data (if any) remains intact
    } else {
        console.error('No set-cookie header found in the response.');
    }
});

  it('should end a session', async () => {
    const sessionData = { userId: '123' };
    const sessionId = await createNewSession(server, sessionData);
  
    // End the session
    await endSession(server, sessionId);
  
    // Attempt to renew the ended session (this should fail)
    await request(server)
      .post('/api/renew-session')
      .set('Cookie', `sessionId=${sessionId}`)
      .expect(404);
  });
  
  // Example for other utility functions
  it('should retrieve and modify session data', async () => {
    const sessionData = { userId: '123' };
    const sessionId = await createNewSession(server, sessionData);
  
    // Retrieve and check the session data
    const originalData = await retrieveSessionData(server, sessionId);
    expect(originalData.userId).toBe('123');
  
    // Modify session data
    const updatedData = { userId: '456' };
    await modifySessionData(server, sessionId, updatedData);
  
    // Retrieve the modified data and check
    const newData = await retrieveSessionData(server, sessionId);
    expect(newData.userId).toBe('456');
  });

  function getSessionDetails(response) {
    const cookies = response.headers['set-cookie'];
    const sessionId = parseSessionIdFromCookie(cookies);
    return { sessionId, cookie: cookies };
  }