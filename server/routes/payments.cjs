const express = require('express');
const router = express.Router();
console.log('payments.cjs is executing');

const { session } = require('../services/sessionManager.cjs');

const { createPayment, getPaymentById } = require('../controllers/paymentController.cjs');
console.log('PaymentController imported successfully');

// Define the verifySession middleware
function verifySession(req, res, next) {
  // You need to ensure that `req.sessionId` is correctly defined before using it
  // Assuming it's coming from a middleware or a previous part of the request
  const userSession = session.getSession(req.sessionId);

  if (!userSession) {
    // Handle invalid session
    res.status(401).json({ message: 'Invalid session' });
  } else {
    // Valid session
    next();
  }
}

// Define the validationMiddleware
const { validatePayment } = require('../middleware/validationMiddleware.cjs');

// Use the createPayment function from the controller as the callback for POST '/'
router.post('/', verifySession, validatePayment, async (req, res) => {
  try {
    // Assuming `req.body` contains the necessary data for payment
    const paymentIntent = await createPayment(req.body);
    res.json(paymentIntent);
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id);
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
