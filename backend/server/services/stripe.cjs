// stripe.cjs

// Require stripe
const Stripe = require("stripe");

// Initialize stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Function to create payment intent
async function createIntent(amount, currency) {
  try {
    // Call Stripe API to create intent
    // Configure intent as needed
    return await stripe.paymentIntents.create({
      amount,
      currency,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Export functionality
module.exports = {
  createIntent,
};
