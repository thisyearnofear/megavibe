// test/sessionController.test.cjs

const request = require('supertest');
const express = require('express');
const sessionController = require('../controllers/sessionController.cjs');
const { sessionMiddleware } = require('../middleware/sessionMiddleware.cjs');
const saveSessionMock = jest.spyOn(sessionController, 'saveSession');

const app = express();
app.use(express.json());
app.use(sessionMiddleware); // Use the session middleware
app.post('/session', sessionController.createSession);

// Happy path test
test('should create a session when userId is provided', async () => {

  saveSessionMock.mockResolvedValue(); // Make it resolve

  // Arrange
  const reqBody = { userId: '123' };

  // Act
  const response = await request(app).post('/session').send(reqBody);

  // Assert
  expect(response.statusCode).toBe(201); 
  expect(response.body.message).toBe('Session created');
});


// Edge case: No userId provided
test('should create a session even when userId is not provided', async () => {
  // Arrange
  const reqBody = {}; // No userId provided

  // Act
  const response = await request(app).post('/session').send(reqBody);

  // Assert
  expect(response.statusCode).toBe(201); 
  expect(response.body.message).toBe('Session created');

  // Check if the set-cookie header is defined
  expect(response.headers['set-cookie']).toBeDefined();
});

// Error case: Session save error
test('should handle session save error', async () => {
  saveSessionMock.mockRejectedValue(new Error('Session save error'));

  // Arrange
  const reqBody = { userId: '123' };

   // Act
   const response = await request(app).post('/session').send(reqBody);

  // Assert
  expect(response.statusCode).toBe(500); // This should be 500
  expect(response.body.error.message).toBe('Session save error');
});

// Error case: Unexpected error
test('should handle unexpected error', async () => {
  // Arrange
  const reqBody = { userId: '123' };

  // Provide the implementation for the mocked saveSession function
  sessionController.saveSession.mockImplementation(() => { throw new Error('Unexpected error'); });

  // Act
  const response = await request(app).post('/session').send(reqBody);

  // Assert
  expect(response.statusCode).toBe(500); // This should be 500
  expect(response.body.message).toBe('Unexpected error');
});

afterEach(() => {
  jest.restoreAllMocks();
  saveSessionMock.mockRestore();
});