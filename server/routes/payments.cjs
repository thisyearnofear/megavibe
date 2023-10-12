const express = require('express');
const router = express.Router();
console.log('payments.cjs is executing');

const { createPayment, getPaymentById } = require('../controllers/paymentController.cjs');
console.log('PaymentController imported successfully');

const { validatePayment, validationMiddleware } = require('../middleware/validationMiddleware.cjs'); // Change to validatePayment

// Use the createPayment function from the controller as the callback for POST '/'
router.post('/', validatePayment, validationMiddleware, createPayment);

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
