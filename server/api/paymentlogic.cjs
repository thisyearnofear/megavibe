const stripe = require('../../services/stripe.cjs'); // Import the Stripe client
const { createPayment } = require('../../controllers/paymentController.cjs'); // Update the import path

const handlePayment = async (req, res) => {
  const { paymentMethodId, amount, currency } = req.body;

  try {
    const paymentIntent = await createPayment(paymentMethodId, amount, currency); // Use the createPayment function from the controller
    res.json(paymentIntent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  handlePayment,
};
