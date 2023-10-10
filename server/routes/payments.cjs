const express = require('express');
const router = express.Router();
console.log('payments.cjs is executing'); // Add this line

const { createPayment, getPaymentById } = require('./controllers/paymentController.cjs');
console.log('PaymentController imported successfully'); // Add this line

const { validateBody } = require('../middleware/validationMiddleware.cjs');

// Use the createPayment function from the controller as the callback for POST '/'
router.post('/', validateBody, createPayment);

router.get('/:id', async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id); // Corrected function call
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
