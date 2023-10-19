// Import dotenv
const dotenv = require('dotenv');
const request = require('supertest');
const { app } = require('../server.cjs'); // Ensure that you import your Express app correctly
const mongoose = require('mongoose');
const { port } = require('../config/index.cjs'); // Import the port from the correct location
const { mockRes } = require('./testUtils');
const { mockRequest } = require('./mockRequest');

// ... Database connection setup ...
beforeAll(async () => {
    try {
      await mongoose.connect(process.env.SESSION_MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } catch (error) {
      console.error('Failed to connect to the database:', error);
    }
  });
  
  afterAll(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error('Failed to close the database connection:', error);
    }
  });

// Load the .env.test file
dotenv.config({ path: '.env.test' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('Session API', () => {
    it('should create a new session and return the session ID', async () => {
        const res = await request(app)
          .post('/api/create-session') // Update to the correct route
          .send({ userId: '123' })
          .expect(200); // Use the `expect` function to check the response status

            // Assert that the response contains a session ID
  expect(res.body).toHaveProperty('sessionId');
    });

    it('should retrieve a specific session', async () => {
        // Create a session to retrieve
        const createRes = await request(app)
          .post('/api/create-session')
          .send({ userId: '123' });
      
        const { sessionId } = createRes.body;
      
        // Retrieve the created session using the sessionId and set the 'Cookie' header
        const retrieveRes = await request(app)
          .get('/api/retrieve-session')
          .set('Cookie', createRes.headers['set-cookie']); // Send the session cookie
      
        expect(retrieveRes.status).toEqual(200);
        expect(retrieveRes.body).toHaveProperty('sessionId', sessionId);
      });
      
      
      it('should fail to retrieve a non-existent session', async () => {
        const res = await request(app)
          .get('/api/retrieve-session');
      
        expect(res.status).toEqual(404);
      });

      it('should create a new session without a user ID and return the session ID', async () => {
        const res = await request(app)
          .post('/api/create-session')
          .send({}) // Sending an empty object to simulate no user ID
          .expect(200);
      
        // Assert that the response contains a session ID
        expect(res.body).toHaveProperty('sessionId');
      });
      
      it('should retrieve a specific session', async () => {
        // Create a session to retrieve
        const createRes = await request(app)
          .post('/api/create-session')
          .send({ userId: '123' });
      
        const { sessionId } = createRes.body;
      
        // Retrieve the created session using the sessionId
        const retrieveRes = await request(app)
          .get(`/api/retrieve-session`)
          .set('Cookie', createRes.headers['set-cookie']); // Send the session cookie
      
        expect(retrieveRes.status).toEqual(200);
        expect(retrieveRes.body).toHaveProperty('sessionId', sessionId);
      });
      
      it('should fail to retrieve a non-existent session', async () => {
        const res = await request(app)
          .get('/api/retrieve-session')
          .expect(404); // Expecting a 404 Not Found status
      });
      
      it('should handle server errors when retrieving a session', async () => {
        // Mock a scenario where the server encounters an error
        // This may involve modifying your session retrieval logic temporarily
        const createRes = await request(app)
          .post('/api/create-session')
          .send({ userId: '123' });
      
        const { sessionId } = createRes.body;
      
        // Modify the session retrieval logic to induce a server error
        // For example, you can force a database connection error
      
        // Attempt to retrieve the created session using the sessionId
        const retrieveRes = await request(app)
          .get(`/api/retrieve-session`)
          .set('Cookie', createRes.headers['set-cookie']);
      
        expect(retrieveRes.status).toEqual(500); // Expecting a 500 Internal Server Error status
        // Ensure that the response contains a meaningful error message
        expect(retrieveRes.body).toHaveProperty('message', 'Internal server error');
      });
      
    });