const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./expressApp.cjs');
const https = require('https');
const routesLoader = require('./routesLoader.cjs');
const { port } = require('./config/index.cjs');
const errorHandlers = require('./utils/errorhandlers.cjs');
const validationMiddleware = require('./middleware/validationMiddleware.cjs');
const cspMiddleware = require('./middleware/cspMiddleware.cjs');
const corsMiddleware = require('./middleware/corsMiddleware.cjs');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const userStore = require('./data/userstore.cjs');
const sessionManager = require('./services/sessionManager.cjs');
const { sessionMiddleware, store } = require('./middleware/sessionMiddleware.cjs'); // Import the store variable
const tipRouter = require('./api/tiprouter.cjs');

const session = require('express-session');
const Stripe = require('stripe');
const stripe = require('./services/stripe.cjs');
const express = require('express');

// Generate a dynamic user ID
const dynamicUserId = uuidv4();

const mongoose = require('./services/mongoDbconnection.cjs');

const verifySession = require('./middleware/verifySession.cjs');
const protectedRoute = require('./routes/protectedRoute.cjs');

app.use(corsMiddleware);
app.use(sessionMiddleware); 

app.get('/api/create-session', async (req, res) => {
  try {
    // express-session automatically creates a session, we just need to send back the ID
    res.json({ sessionId: req.session.id });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/retrieve-session', verifySession, async (req, res) => {
  try {
    const { sessionId } = req.session;
    const sessionData = await sessionManager.getSession(sessionId);

    if (sessionData) {
      res.json({ sessionId, sessionData });
    } else {
      res.status(404).send('Session not found');
    }
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Load routes dynamically
routesLoader(app);

// Use the protected route
app.use('/protected', protectedRoute);

app.use(cspMiddleware);

app.post('/create-payment-intent', validationMiddleware.validationMiddleware, async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await createIntent(amount, currency);
    res.send(paymentIntent);
  } catch (error) {
    errorHandlers.handleStripeError(res, error);
  }
});

// POST endpoint
app.post('/api/create-session', (req, res) => {
  try {
    // You can check if the 'userId' is provided in the request body
    const { userId } = req.body;
    const sessionId = req.session.id;

    // If a 'userId' is provided, include it in the response
    if (userId) {
      res.json({ sessionId, userId });
    } else {
      // If 'userId' is not provided, return only the session ID
      res.json({ sessionId });
    }
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.use('/api/tips', tipRouter);

// Error Handling Middleware
app.use((error, req, res, next) => {
  errorHandlers.handleError(res, error);
})

// Import createIntent function from stripe.cjs 
const { createIntent } = require('./services/stripe.cjs');

// server.cjs
module.exports = {
  app,
};