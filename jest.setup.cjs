// jest.setup.cjs

const dotenv = require('dotenv');
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { setupEnvironmentVariablesForTesting } = require('./server/test/setEnvVars.cjs');
const mongoose = require('mongoose');
const mongoSetup = require('./testSetup');

const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const app = express();

app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

let mongoServer;

beforeAll(async () => {
  // Setup the environment variables for testing
  setupEnvironmentVariablesForTesting(); // Call the function here

  // Start an in-memory MongoDB server
  mongoServer = await mongoSetup.startMongoServer(); 
  const mongoUri = await mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  // Close the database connection and stop the in-memory MongoDB server
  await mongoSetup.stopMongoServer(mongoServer);

  await mongoose.disconnect();
});

beforeEach(async () => {
  // Create a new session before each test
  const createRes = await request(app)
    .post('/api/create-session')
    .send({ userId: '123' });

  if (createRes.status === 200 || createRes.status === 201) {
    // Session creation was successful
    // Extract the session ID from the response cookie
    const sessionCookie = createRes.headers['set-cookie'][0];
    const sessionId = /sessionId=([^;]+)/.exec(sessionCookie)[1];

    // Store the session ID for later use
    global.session = { sessionId, cookie: sessionCookie };
  } else {
    console.error('Session creation failed. Check your session creation logic.');
  }
});

module.exports = app;