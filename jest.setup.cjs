// jest.setup.cjs

const supertest = require('supertest');
const supertestSession = require('supertest-session');

process.env.NODE_ENV = 'test';

const { setupEnvironmentVariablesForTesting } = require('./server/test/setEnvVars.cjs');
setupEnvironmentVariablesForTesting(); 

const request = require('supertest');
const mongoose = require('mongoose');
const mongoSetup = require('./testSetup');

const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const { sessionMiddleware } = require('./server/middleware/sessionMiddleware.cjs');
const sessionConfig = require('./server/config/sessionconfig.cjs'); 
const sessionRoutes = require('./server/routes/sessionRoutes.cjs');

const server = express();
server.use(sessionMiddleware);
server.use(session(sessionConfig)); 
server.use(sessionRoutes);

let mongoServer;

beforeAll(async () => {

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
  const testSession = supertestSession(server);

  const createRes = await testSession
    .post('/api/create-session')
    .send({ userId: '123' })
    .catch(err => console.error(err));

    console.log('createRes.status:', createRes.status);
  console.log('createRes.body:', createRes.body);
  console.log('createRes.headers:', createRes.headers);


  if (createRes.status === 200 || createRes.status === 201)   {
    // Session creation was successful
    // Extract the session ID from the response cookie
    const sessionCookie = createRes.headers['set-cookie'][0];
    const sessionId = /sessionId=([^;]+)/.exec(sessionCookie)[1];
    console.log('Session cookie:', sessionCookie);
    console.log('Session ID:', sessionId);

    // Store the session ID for later use
    global.session = { sessionId, cookie: sessionCookie };
  } else {
    throw new Error(`Session creation failed with status code: ${createRes.status}`);
  }
});

module.exports = server;