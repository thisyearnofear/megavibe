// users.test.cjs
const request = require('supertest');
const express = require('express');
const app = express();

const { getUser } = require('../controllers/usersController.cjs');

// Set up an Express application for testing
app.get('/users/:id', getUser);

describe('User Controller', () => {
  // This is a test suite for the User Controller

  it('should return a user', async () => {
    // This is a test case
    const userId = '123';

    // Send a GET request to the '/users/:id' endpoint with a specific user ID
    const res = await request(app)
      .get(`/users/${userId}`)
      .expect(200);

    // Assert that the response body matches the expected user properties
    expect(res.body).toEqual({
      id: userId,
      // ...other user properties
    });
  });

  it('should return 404 if the user is not found', async () => {
    // This is another test case
    const res = await request(app)
      .get('/users/non-existent-user')
      .expect(404);

    // Assert that the response status code is 404
  });
});
