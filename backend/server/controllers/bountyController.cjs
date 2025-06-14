// server/controllers/bountyController.cjs
const Bounty = require("../models/bountyModel.cjs");
const { createIntent } = require("../services/stripe.cjs");
const {
  validatePayment,
  validationMiddleware,
} = require("../middleware/validationMiddleware.cjs");

async function createBounty(req, res, next) {
  try {
    const {
      title,
      description,
      bountyAmount,
      venueId,
      eventId,
      topic,
      deadline,
    } = req.body;
    const userId = req.user ? req.user._id : null; // Assuming user is authenticated

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required to create a bounty" });
    }

    if (!title || !bountyAmount) {
      return res
        .status(400)
        .json({ message: "Title and amount are required fields" });
    }

    const bounty = await Bounty.create({
      title,
      description,
      bountyAmount,
      venueId,
      eventId,
      topic,
      userId,
      deadline: deadline || null,
    });

    // Use Mantle blockchain for bounty creation instead of Stripe
    const mantleService = require("../services/mantleService.cjs");
    // Note: fromPrivateKey should be securely obtained from the user's session or frontend
    // This is a placeholder for demonstration; in a real implementation, handle private key securely
    const fromPrivateKey = req.body.fromPrivateKey || "placeholder_private_key";
    const result = await mantleService.createBounty(
      bounty._id.toString(),
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
    if (venueId) {
      websocketService.broadcastToVenue(venueId, {
        type: "NEW_BOUNTY",
        bountyId: bounty._id,
        title: bounty.title,
        amount: bounty.bountyAmount,
        message: `A new bounty "${bounty.title}" worth ${bounty.bountyAmount} USDC has been created!`,
      });
    }

    res.status(201).json({ message: "Bounty created successfully", bounty });
  } catch (error) {
    next(error); // Pass the error to the next middleware
  }
}

async function getBounties(req, res, next) {
  try {
    const {
      venueId,
      eventId,
      topic,
      status = "active",
      sortBy,
      limit = 20,
      page = 1,
    } = req.query;
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
    if (status) {
      query.status = status;
    }

    // Apply sorting if provided
    let sort = { createdAt: -1 }; // Default: newest first
    if (sortBy === "amount") {
      sort = { bountyAmount: -1 }; // Highest amount first
    } else if (sortBy === "deadline") {
      sort = { deadline: 1 }; // Earliest deadline first
    } else if (sortBy === "popularity") {
      sort = { votesFor: -1 }; // Most popular first based on votes
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
    next(error);
  }
}

async function getLiveBountiesForVenue(req, res, next) {
  try {
    const { venueId } = req.params;
    const { limit = 5 } = req.query;

    if (!venueId) {
      return res.status(400).json({ message: "Venue ID is required" });
    }

    const bounties = await Bounty.find({
      venueId: venueId,
      status: "active",
    })
      .sort({ bountyAmount: -1, createdAt: -1 }) // Sort by amount (highest first) and creation date (newest first)
      .limit(parseInt(limit));

    // Broadcast to performers in real-time if there are active bounties
    if (bounties.length > 0) {
      const websocketService = require("../services/websocket.cjs");
      websocketService.broadcastToVenue(venueId, {
        type: "LIVE_BOUNTIES_UPDATE",
        bounties: bounties.map((bounty) => ({
          id: bounty._id,
          title: bounty.title,
          amount: bounty.bountyAmount,
        })),
        message: `Active bounties available at this venue! Highest: ${bounties[0].title} for ${bounties[0].bountyAmount} USDC.`,
      });
    }

    res.status(200).json({
      message: "Live bounties retrieved successfully",
      bounties,
    });
  } catch (error) {
    next(error);
  }
}

async function submitEvidence(req, res, next) {
  try {
    const { bountyId, evidenceUrl } = req.body;
    const bounty = await Bounty.findById(bountyId);

    if (!bounty) {
      return res.status(404).json({ message: "Bounty not found" });
    }

    if (bounty.status !== "active" && bounty.status !== "claimed") {
      return res.status(400).json({
        message: "Bounty is not in a valid state for evidence submission",
      });
    }

    bounty.evidenceUrl = evidenceUrl;
    bounty.status = "claimed";
    await bounty.save();

    // Broadcast evidence submission to the venue for community review
    const websocketService = require("../services/websocket.cjs");
    websocketService.broadcastToVenue(bounty.venueId, {
      type: "BOUNTY_EVIDENCE_SUBMITTED",
      bountyId: bounty._id,
      evidenceUrl: evidenceUrl,
      message:
        "Evidence submitted for bounty fulfillment. Community review requested.",
    });

    res
      .status(200)
      .json({ message: "Evidence submitted successfully", bounty });
  } catch (error) {
    next(error);
  }
}

async function voteOnBounty(req, res, next) {
  try {
    const { bountyId, vote } = req.body; // vote should be 'for' or 'against'
    const userId = req.user ? req.user._id : null; // Assuming user is authenticated

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required to vote on a bounty" });
    }

    const bounty = await Bounty.findById(bountyId);

    if (!bounty) {
      return res.status(404).json({ message: "Bounty not found" });
    }

    if (bounty.status !== "claimed") {
      return res
        .status(400)
        .json({ message: "Bounty is not in a state for voting" });
    }

    // Prevent duplicate voting (assuming a simple check for userId in votedUsers array)
    if (bounty.votedUsers && bounty.votedUsers.includes(userId.toString())) {
      return res
        .status(400)
        .json({ message: "You have already voted on this bounty" });
    }

    if (vote === "for") {
      bounty.votesFor += 1;
    } else if (vote === "against") {
      bounty.votesAgainst += 1;
    } else {
      return res.status(400).json({ message: "Invalid vote value" });
    }

    // Record the user who voted to prevent duplicates
    if (!bounty.votedUsers) {
      bounty.votedUsers = [];
    }
    bounty.votedUsers.push(userId.toString());

    // Simple threshold for verification: if votesFor reach a certain number or ratio, mark as verified
    const voteThreshold = 10; // Example threshold
    const voteRatio = bounty.votesFor / (bounty.votesFor + bounty.votesAgainst);
    if (bounty.votesFor >= voteThreshold && voteRatio >= 0.7) {
      bounty.isVerified = true;
      bounty.status = "completed";
      // Trigger payout via smart contract if verified
      const mantleService = require("../services/mantleService.cjs");
      const payoutResult = await mantleService.releaseBountyFunds(
        bounty.blockchainTransactionId,
        bounty.bountyAmount
      );
      if (payoutResult.success) {
        bounty.payoutTransactionId = payoutResult.transactionId;
        console.log(
          `Bounty ${bountyId} verified by community vote. Payout successful: ${payoutResult.transactionId}`
        );
      } else {
        console.error(
          `Bounty ${bountyId} payout failed: ${payoutResult.error}`
        );
        // Optionally, handle failed payout (e.g., notify admin, retry logic)
      }
    }

    await bounty.save();

    // Broadcast voting update to the venue
    const websocketService = require("../services/websocket.cjs");
    websocketService.broadcastToVenue(bounty.venueId, {
      type: "BOUNTY_VOTE_UPDATE",
      bountyId: bounty._id,
      votesFor: bounty.votesFor,
      votesAgainst: bounty.votesAgainst,
      isVerified: bounty.isVerified,
      message: bounty.isVerified
        ? "Bounty verified by community!"
        : "Community voting updated for bounty.",
    });

    res.status(200).json({ message: "Vote recorded successfully", bounty });
  } catch (error) {
    next(error);
  }
}

async function submitPoidhEvidence(req, res, next) {
  try {
    const { bountyId, evidenceUrl, evidenceHash } = req.body;
    const userId = req.user ? req.user._id : null; // Assuming user is authenticated

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required to submit evidence" });
    }

    const bounty = await Bounty.findById(bountyId);

    if (!bounty) {
      return res.status(404).json({ message: "Bounty not found" });
    }

    if (bounty.status !== "active" && bounty.status !== "claimed") {
      return res.status(400).json({
        message: "Bounty is not in a valid state for evidence submission",
      });
    }

    // POIDH (Proof Or It Didn't Happen) Integration: Store evidence hash for verification
    bounty.evidenceUrl = evidenceUrl;
    bounty.evidenceHash = evidenceHash || "pending_hash_verification"; // Placeholder if hash not provided
    bounty.status = "claimed";
    bounty.claimedBy = userId;
    await bounty.save();

    // Broadcast evidence submission to the venue for community review
    const websocketService = require("../services/websocket.cjs");
    websocketService.broadcastToVenue(bounty.venueId, {
      type: "BOUNTY_EVIDENCE_SUBMITTED",
      bountyId: bounty._id,
      evidenceUrl: evidenceUrl,
      message:
        "Evidence submitted for bounty fulfillment. Community review requested.",
    });

    res
      .status(200)
      .json({ message: "Evidence submitted successfully with POIDH", bounty });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBounty: [validatePayment, validationMiddleware, createBounty],
  getBounties,
  getLiveBountiesForVenue,
  submitEvidence,
  submitPoidhEvidence,
  voteOnBounty,
};
