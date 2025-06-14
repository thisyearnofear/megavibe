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

    // Broadcast the new bounty to the relevant venue for real-time display
    const websocketService = require("../services/websocket.cjs");
    websocketService.broadcastToVenue(bounty.venueId, {
      type: "NEW_BOUNTY",
      bountyId: bounty._id,
      songId: bounty.songId,
      amount: bounty.bountyAmount,
      message: "A new bounty has been created!",
    });

    res.status(201).json({ message: "Bounty created", bounty });
  } catch (error) {
    next(error); // Pass the error to the next middleware
  }
}

async function getBounties(req, res) {
  try {
    const { venueId, eventId, topic, sortBy, limit = 20, page = 1 } = req.query;
    let query = {};

    // Apply filters if provided
    if (venueId) {
      query.venueId = venueId;
    }
    if (eventId) {
      query.eventId = eventId;
    }
    if (topic) {
      query.topic = { $regex: topic, $options: "i" }; // Case-insensitive search
    }

    // Apply sorting if provided
    let sort = { createdAt: -1 }; // Default: newest first
    if (sortBy === "amount") {
      sort = { bountyAmount: -1 }; // Highest amount first
    } else if (sortBy === "deadline") {
      sort = { deadline: 1 }; // Earliest deadline first
    }

    // Apply pagination
    const skip = (page - 1) * limit;

    const bounties = await Bounty.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Bounty.countDocuments(query);

    res.status(200).json({
      bounties,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createBounty: [validatePayment, validationMiddleware, createBounty],
  getBounties,
};
