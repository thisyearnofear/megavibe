const express = require('express');
const router = express.Router();
const { createPayment, getPaymentById } = require('../controllers/paymentController.cjs');
const { validatePayment } = require('../middleware/validationMiddleware.cjs');

async function verifySession(req, res, next) {
  const userSession = await sessionManager.getSession(req.sessionid);

  if (!userSession) {
    res.status(401).json({ message: 'Invalid session' });
  } else {
    next();
  }
}

router.post('/', verifySession, validatePayment, async (req, res) => {
  try {
    const paymentIntent = await createPayment(req.body);
    res.json(paymentIntent);
  } catch (error) {
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