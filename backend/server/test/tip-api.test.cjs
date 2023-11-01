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

describe('Tip API', () => {
    it('should create a new tip and return a success message', async () => {
      const res = await request(app)
        .post('/api/tip') // Replace with your actual route
        .send({ songId: 'On My Way Test', amount: 10 })
        .expect(201) // Use the `expect` function to check the response status
        .end(); // Ensure the request is properly closed
    }, 10000); // Increased timeout
  
    it('should fail to create a new tip with invalid data', async () => {
      const res = await request(app)
        .post('/api/tip') // Replace with your actual route
        .send({ songId: '', amount: '' });
  
      expect(res.status).toEqual(400);
    });
  
    it('should retrieve a specific tip', async () => {
      // First, create a tip and get the tipId
      const createRes = await request(app)
        .post('/api/tip') // Replace with your actual route
        .send({ songId: 'On My Way Test', amount: 10 });
  
      const { tipId } = createRes.body;
  
      // Then, retrieve the created tip using the tipId
      const retrieveRes = await request(app)
        .get(`/api/tip/${tipId}`); // Replace with your actual route
  
      expect(retrieveRes.status).toEqual(200);
      expect(retrieveRes.body).toHaveProperty('tipId', tipId);
    });
  
    it('should fail to retrieve a non-existent tip', async () => {
      const res = await request(app)
        .get('/api/tip/nonexistent-tip'); // Replace with a non-existent tip ID
  
      expect(res.status).toEqual(404);
    });
  
    it('should delete a specific tip', async () => {
      // First, create a tip and get the tipId
      const createRes = await request(app)
        .post('/api/tip') // Replace with your actual route
        .send({ songId: 'On My Way Test', amount: 10 });
  
      const { tipId } = createRes.body;
  
      // Then, delete the created tip using the tipId
      const deleteRes = await request(app)
        .delete(`/api/tip/${tipId}`); // Replace with your actual route
  
      expect(deleteRes.status).toEqual(200);
    });
  
    it('should fail to delete a non-existent tip', async () => {
      const res = await request(app)
        .delete('/api/tip/nonexistent-tip'); // Replace with a non-existent tip ID
  
      expect(res.status).toEqual(404);
    });
  
    it('should update a specific tip', async () => {
      // First, create a tip and get the tipId
      const createRes = await request(app)
        .post('/api/tip') // Replace with your actual route
        .send({ songId: 'On My Way Test', amount: 10 });
  
      const { tipId } = createRes.body;
  
      // Then, update the created tip using the tipId
      const updateRes = await request(app)
        .put(`/api/tip/${tipId}`) // Replace with your actual route
        .send({ songId: 'New Song', amount: 20 });
  
      expect(updateRes.status).toEqual(200);
      expect(updateRes.body).toHaveProperty('message', 'Tip updated successfully');
    }, 20000); // Increased timeout
  });
  