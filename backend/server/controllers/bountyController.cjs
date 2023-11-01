// server/controllers/bountyController.cjs
const Bounty = require('../models/bountyModel.cjs');
const { createIntent } = require('../services/stripe.cjs');
const { validatePayment, validationMiddleware } = require('../middleware/validationMiddleware.cjs');

async function createBounty(req, res, next) {
  try {
    const { userId, songId, bountyAmount } = req.body;
    const bounty = await Bounty.create({ userId, songId, bountyAmount });

    // Create a payment intent with Stripe
    const paymentIntent = await createIntent(bountyAmount * 100, 'usd');

    // Add the Stripe payment intent ID to the bounty
    bounty.stripePaymentIntent = paymentIntent.id;
    await bounty.save();

    res.status(201).json({ssage: 'B meundefinedunty created', bounty });
  } catch (error) {
    next(error); // Pass the error to the next middleware
  }
}

async function getBounties(req, res) {
  try {
    const bounties = await Bounty.find();
    res.status(200).json(bounties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createBounty: [validatePayment, validationMiddleware, createBounty],
  getBounties,
};