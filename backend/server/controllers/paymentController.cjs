// server/controllers/paymentController.cjs
const Payment = require('../models/paymentModel.cjs');
const { createIntent } = require('../services/stripe.cjs');

async function createPayment(req, res, next) {
  try {
    const { amount, song, type } = req.body;
    const payment = await Payment.create({
      amount,
      song,
      type,
      status: 'pending',
    });

    const intent = await createIntent(amount, 'usd');
    payment.stripePaymentIntent = intent.id;
    await payment.save();

    console.log('Payment created successfully:', payment);

    res.status(201).json(payment);
  } catch (error) {
    next(error); // Pass the error to the next middleware (error handler)
  }
}

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    res.status(200).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

console.log('createPayment:', createPayment, typeof createPayment); // Add this line

module.exports.createPayment = createPayment;
module.exports.getPaymentById = getPaymentById;