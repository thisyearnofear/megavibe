// jest.setup.cjs

const dotenv = require('dotenv');
const app = require('./server/test-server.cjs');

// Load the .env.test file
dotenv.config({ path: '.env.test' });

let server;

beforeAll((done) => {
  server = app.listen(0, () => {
    console.log(`Global setup: Server is running on port ${server.address().port}`);
    done();
  });
});

afterAll((done) => {
  server.close(() => {
    console.log('Global teardown: Server is closed');
    done();
  });
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


module.exports = server;