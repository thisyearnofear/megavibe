const path = require('path');
const app = require('./expressApp.cjs');
const routesLoader = require('./routesLoader.cjs');
const { mongoURI, port } = require('./config/index.cjs'); // Import configuration values
const errorHandlers = require('./utils/errorhandlers.cjs');
const validationMiddleware = require('./middleware/validationMiddleware.cjs');
const connectDB = require('./services/db.cjs'); // Import connectDB function
const { createIntent } = require('./services/stripe.cjs'); // Import createIntent function
const cspMiddleware = require('./middleware/cspMiddleware.cjs');
const corsMiddleware = require('./middleware/corsMiddleware.cjs');

require('dotenv').config({ path: './../.env' });

// Connect to MongoDB
connectDB();

// Load routes dynamically
routesLoader(app);

// Apply validation middleware to routes that require validation
app.post('/pay', validationMiddleware, async (req, res) => {
  const { paymentMethodId, amount, currency } = req.body;

  try {
    const paymentIntent = await createIntent(amount, currency);
    res.send(paymentIntent);
  } catch (error) {
    errorHandlers.handleStripeError(res, error);
  }
});

app.post('/create-payment-intent', validationMiddleware, async (req, res) => {
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

app.use(corsMiddleware);
app.use(cspMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
