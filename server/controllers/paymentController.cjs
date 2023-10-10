const Payment = require('../models/payment.cjs');
const { createIntent } = require('../services/stripe.cjs');

async function createPayment(req, res) {
  try {
    console.log('createPayment function is executing'); // Add this line

    const { amount, user, song, type } = req.body;
    const payment = await Payment.create({
      amount,
      user,
      song,
      type,
      status: 'pending',
    });

    const intent = await createIntent(amount);
    payment.stripePaymentIntent = intent.id;
    await payment.save();

    console.log('Payment created successfully:', payment); // Add this line

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
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