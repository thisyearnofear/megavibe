const path = require('path');
const app = require('./expressApp.cjs');
const https = require('https');
const routesLoader = require('./routesLoader.cjs');
const { port } = require('./config/index.cjs');
const errorHandlers = require('./utils/errorhandlers.cjs');
const validationMiddleware = require('./middleware/validationMiddleware.cjs');
const cspMiddleware = require('./middleware/cspMiddleware.cjs');
const corsMiddleware = require('./middleware/corsMiddleware.cjs');
const fs = require('fs');
require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const userStore = require('./data/userstore.cjs');
const sessionManager = require('./services/sessionManager.cjs');
const sessionSecret = 'dD$1pJ#p@!QeR2yX^tVnA*0HmS6gLcWmXpYzQ2!eZ';
const { sessionMiddleware, store } = require('./middleware/sessionMiddleware.cjs'); // Import the store variable

const session = require('express-session');
const Stripe = require('stripe');
const stripe = require('./services/stripe.cjs');
const express = require('express');

// Generate a dynamic user ID
const dynamicUserId = uuidv4();

const client = require('./services/mongoDbconnection.cjs'); 

const verifySession = require('./middleware/verifySession.cjs');
const protectedRoute = require('./routes/protectedRoute.cjs');

app.use(express.json()); 
app.use(corsMiddleware);
app.use(sessionMiddleware); 

// Initialize session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.post('/api/create-session', (req, res) => {
  const { sessionId } = req.session; // Get the session ID from req.session
  req.session.sessionId = sessionId;
  res.json({ sessionId });
});

app.get('/api/get-session', verifySession, (req, res) => { // Use verifySession middleware here
  const { sessionId } = req.session; // Get the session ID from req.session
  const sessionData = sessionManager.getSession(sessionId);
  if (sessionData) {
    res.json({ sessionId, sessionData });
  } else {
    res.status(401).send('Unauthorized');
  }
});

// Load routes dynamically
routesLoader(app);

// Use the protected route
app.use('/protected', protectedRoute);

app.use(cspMiddleware);

// Apply validation middleware to routes that require validation
app.post('/pay', validationMiddleware.validationMiddleware, async (req, res) => {
  const { sessionId, paymentMethodId, amount, currency } = req.body;

  // Access the session
  const userSession = req.session;

  // Example: Storing data in the session
  userSession.username = 'exampleUsername';

  try {
    const paymentIntent = await createIntent(amount, currency);
    res.send(paymentIntent);
  } catch (error) {
    errorHandlers.handleStripeError(res, error);
  }
});

app.post('/create-payment-intent', validationMiddleware.validationMiddleware, async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await createIntent(amount, currency);
    res.send(paymentIntent);
  } catch (error) {
    errorHandlers.handleStripeError(res, error);
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    errorHandlers.handleValidationErrors(err, res);
  } else {
    errorHandlers.handleUncaughtExceptions(err, res);
  }
});

// Import createIntent function from stripe.cjs 
const { createIntent } = require('./services/stripe.cjs');

// HTTPS Configuration
const serverOptions = {
  key: fs.readFileSync(path.resolve(__dirname, 'server-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, 'server-crt.pem')),
};

// Create an HTTPS server
const httpsServer = https.createServer(serverOptions, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS Server is running on port ${port}`);
});
