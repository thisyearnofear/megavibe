// test/utils/session-utils.cjs

const request = require('supertest');

// Utility function to create a new session
async function createNewSession(app, data) {
  const createRes = await request(app)
    .post('/api/create-session')
    .send(data)
    .expect(201); // Expect a 201 status code for successful creation

  // Extract and return the session ID
  const sessionCookie = createRes.headers['set-cookie'][0];
  return getSessionIdFromCookie(sessionCookie);
}

// Utility function to renew a session
async function renewSession(app, sessionId) {
  return await request(app)
    .post('/api/renew-session')
    .set('Cookie', `sessionId=${sessionId}`)
    .expect(200); // Expect a 200 status code for successful renewal
}

// Utility function to end a session
async function endSession(app, sessionId) {
  return await request(app)
    .post('/api/end-session')
    .set('Cookie', `sessionId=${sessionId}`)
    .expect(204); // Expect a 204 status code for successful deletion
}

// Utility function to retrieve session data
async function retrieveSessionData(app, sessionId) {
  return await request(app)
    .get('/api/retrieve-session-data')
    .set('Cookie', `sessionId=${sessionId}`)
    .expect(200);
}

// Utility function to modify session data
async function modifySessionData(app, sessionId, newData) {
  return await request(app)
    .post('/api/modify-session-data')
    .set('Cookie', `sessionId=${sessionId}`)
    .send(newData)
    .expect(200);
}

// Utility function to check session expiry
async function checkSessionExpiry(app, sessionId) {
  return await request(app)
    .get('/api/check-session-expiry')
    .set('Cookie', `sessionId=${sessionId}`)
    .expect(200);
}

// Utility function to simulate an invalid or tampered session
async function simulateInvalidSession(app, sessionId) {
  return await request(app)
    .get('/api/simulate-invalid-session')
    .set('Cookie', `sessionId=${sessionId}`)
    .expect(400);
}

// Utility function to extract the session ID from a cookie
function getSessionIdFromCookie(cookie) {
  const match = /sessionId=([^;]+)/.exec(cookie);
  return match ? match[1] : null;
}

module.exports = {
  createNewSession,
  renewSession,
  endSession,
  retrieveSessionData,
  modifySessionData,
  checkSessionExpiry,
  simulateInvalidSession,
};
