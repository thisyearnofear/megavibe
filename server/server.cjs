const path = require('path');
const app = require('./expressApp.cjs');
const https = require('https'); // Import the 'https' module
const routesLoader = require('./routesLoader.cjs');
const { mongoURI, port } = require('./config/index.cjs'); // Import configuration values
const errorHandlers = require('./utils/errorhandlers.cjs');
const validationMiddleware = require('./middleware/validationMiddleware.cjs');
const connectDB = require('./services/db.cjs'); // Import connectDB function
const { createIntent } = require('./services/stripe.cjs'); // Import createIntent function
const cspMiddleware = require('./middleware/cspMiddleware.cjs');
const corsMiddleware = require('./middleware/corsMiddleware.cjs');
const fs = require('fs'); // Import the 'fs' module
const { v4: uuidv4 } = require('uuid'); // Import the 'uuid' module
const userStore = require('./data/userstore.cjs'); // Import the user data storage module
const sessionManager = require('./services/sessionManager.cjs'); // Import the session manager module
const stripe = require('./services/stripe.cjs');  // Import the Stripe client

const express = require('express');

require('dotenv').config({ path: './../.env' });

// Generate a dynamic user ID
const dynamicUserId = uuidv4();

// Connect to MongoDB
connectDB();

app.use(express.json()); 

app.use(corsMiddleware);

// Load routes dynamically
routesLoader(app);

app.use(cspMiddleware);

// Apply validation middleware to routes that require validation
app.post('/pay', validationMiddleware.validationMiddleware, async (req, res) => {
  const { sessionId, paymentMethodId, amount, currency } = req.body;

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

// HTTPS Configuration
const serverOptions = {
  key: fs.readFileSync(path.resolve(__dirname, 'server-key.pem')), // Use path.resolve to locate your certificate files
  cert: fs.readFileSync(path.resolve(__dirname, 'server-crt.pem')),
};

// Create an HTTPS server
const httpsServer = https.createServer(serverOptions, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS Server is running on port ${port}`);
});
