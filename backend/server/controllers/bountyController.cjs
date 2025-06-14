// server/controllers/bountyController.cjs
const Bounty = require("../models/bountyModel.cjs");
const { createIntent } = require("../services/stripe.cjs");
const {
  validatePayment,
  validationMiddleware,
} = require("../middleware/validationMiddleware.cjs");

async function createBounty(req, res, next) {
  try {
    const { userId, songId, bountyAmount } = req.body;
    const bounty = await Bounty.create({ userId, songId, bountyAmount });

    // Use Mantle blockchain for bounty creation instead of Stripe
    const mantleService = require("../services/mantleService.cjs");
    // Note: fromPrivateKey should be securely obtained from the user's session or frontend
    // This is a placeholder for demonstration; in a real implementation, handle private key securely
    const fromPrivateKey = req.body.fromPrivateKey || "placeholder_private_key";
    const result = await mantleService.createBounty(
      songId,
      bountyAmount,
      fromPrivateKey
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to create bounty on blockchain");
    }

    // Add the blockchain transaction ID to the bounty
    bounty.blockchainTransactionId = result.bountyId;
    await bounty.save();

    res.status(201).json({ message: "Bounty created", bounty });
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
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createBounty: [validatePayment, validationMiddleware, createBounty],
  getBounties,
};
