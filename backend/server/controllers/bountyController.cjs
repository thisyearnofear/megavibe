const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Bounty = require("../models/bountyModel.cjs");
const User = require("../models/userModel.cjs");
const Event = require("../models/eventModel.cjs");
const {
  validateUserSession,
} = require("../middleware/validationMiddleware.cjs");

// Create a new bounty
router.post("/create", validateUserSession, createBounty);

// Get bounties for an event
router.get("/event/:eventId", getBountiesForEvent);

// Get bounties for a speaker
router.get("/speaker/:speakerId", getBountiesForSpeaker);

// Get user's created bounties
router.get("/my-bounties", validateUserSession, getUserBounties);

// Claim a bounty
router.post("/:bountyId/claim", validateUserSession, claimBounty);

// Get bounty details
router.get("/:bountyId", getBountyDetails);

// Update bounty status (admin/automated)
router.put("/:bountyId/status", validateUserSession, updateBountyStatus);

/**
 * Create a new bounty
 */
async function createBounty(req, res, next) {
  try {
    const {
      contractBountyId,
      eventId,
      speakerId,
      description,
      rewardAmount,
      deadline,
      txHash,
      blockNumber,
      contentType,
      requirements,
      tags,
    } = req.body;

    // Validate required fields
    if (
      !contractBountyId ||
      !eventId ||
      !speakerId ||
      !description ||
      !rewardAmount ||
      !deadline ||
      !txHash
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Validate event exists (allow string or ObjectId)
    let event;
    if (mongoose.Types.ObjectId.isValid(eventId)) {
      event = await Event.findById(eventId);
    } else {
      event =
        (await Event.findOne({ _id: eventId })) ||
        (await Event.findOne({ name: eventId })) ||
        null;
    }
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Validate speaker exists
    const speaker = await User.findById(speakerId);
    if (!speaker) {
      return res.status(404).json({ error: "Speaker not found" });
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ error: "Deadline must be in the future" });
    }

    // Create bounty record
    const bounty = new Bounty({
      contractBountyId,
      sponsor: req.user.userId,
      event: eventId,
      speaker: speakerId,
      description,
      rewardAmount,
      deadline: deadlineDate,
      txHash,
      blockNumber,
      contentType: contentType || "video",
      requirements: requirements || {},
      tags: tags || [],
    });

    await bounty.save();

    // Populate for response
    await bounty.populate([
      { path: "sponsor", select: "username avatar" },
      { path: "speaker", select: "username avatar" },
      { path: "event", select: "name" },
    ]);

    // Emit real-time update if socket.io is available
    if (req.app.get("socketio")) {
      req.app.get("socketio").emit("bountyCreated", {
        bountyId: bounty._id,
        eventId: bounty.event._id,
        speakerId: bounty.speaker._id,
        rewardAmount: bounty.rewardAmount,
        description: bounty.description,
        sponsor: bounty.sponsor.username,
      });
    }

    res.status(201).json({
      success: true,
      bounty,
    });
  } catch (error) {
    console.error("Create bounty error:", error);
    next(error);
  }
}

/**
 * Get bounties for an event
 */
async function getBountiesForEvent(req, res, next) {
  try {
    const { eventId } = req.params;
    const { status = "active", limit = 20, offset = 0 } = req.query;

    // DRY: Resolve event ObjectId from string or ObjectId
    let eventObjectId = null;
    if (mongoose.Types.ObjectId.isValid(eventId)) {
      eventObjectId = eventId;
    } else {
      // Try to find event by name
      const eventDoc = await Event.findOne({ name: eventId });
      if (!eventDoc) {
        return res.status(404).json({ error: "Event not found" });
      }
      eventObjectId = eventDoc._id;
    }

    const query = { event: eventObjectId };
    if (status !== "all") {
      query.status = status;
    }

    const bounties = await Bounty.find(query)
      .populate("sponsor", "username avatar")
      .populate("speaker", "username avatar")
      .populate("claimant", "username avatar")
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Get event statistics
    const stats = await Bounty.getEventStats(eventObjectId);

    res.json({
      bounties,
      stats: stats[0] || {
        totalBounties: 0,
        totalReward: 0,
        activeBounties: 0,
        claimedBounties: 0,
      },
      total: bounties.length,
    });
  } catch (error) {
    console.error("Get event bounties error:", error);
    next(error);
  }
}

/**
 * Get bounties for a speaker
 */
async function getBountiesForSpeaker(req, res, next) {
  try {
    const { speakerId } = req.params;
    const { status = "active", timeframe = "30d" } = req.query;

    const query = { speaker: speakerId };
    if (status !== "all") {
      query.status = status;
    }

    const bounties = await Bounty.find(query)
      .populate("sponsor", "username avatar")
      .populate("event", "name")
      .populate("claimant", "username avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    // Get speaker earnings
    const earnings = await Bounty.getSpeakerEarnings(speakerId, timeframe);

    res.json({
      bounties,
      earnings: earnings[0] || {
        totalEarnings: 0,
        bountyCount: 0,
        avgBounty: 0,
      },
    });
  } catch (error) {
    console.error("Get speaker bounties error:", error);
    next(error);
  }
}

/**
 * Get user's created bounties
 */
async function getUserBounties(req, res, next) {
  try {
    const { status = "all" } = req.query;

    const query = { sponsor: req.user.userId };
    if (status !== "all") {
      query.status = status;
    }

    const bounties = await Bounty.find(query)
      .populate("speaker", "username avatar")
      .populate("event", "name")
      .populate("claimant", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ bounties });
  } catch (error) {
    console.error("Get user bounties error:", error);
    next(error);
  }
}

/**
 * Claim a bounty
 */
async function claimBounty(req, res, next) {
  try {
    const { bountyId } = req.params;
    const { submissionHash, submissionUrl } = req.body;

    if (!submissionHash) {
      return res.status(400).json({ error: "Submission hash required" });
    }

    const bounty = await Bounty.findById(bountyId);
    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    // Validate bounty can be claimed
    if (!bounty.canBeClaimed()) {
      return res.status(400).json({
        error:
          bounty.status === "claimed"
            ? "Bounty already claimed"
            : "Bounty expired or inactive",
      });
    }

    // Prevent self-claiming
    if (bounty.sponsor.toString() === req.user.userId) {
      return res.status(400).json({ error: "Cannot claim your own bounty" });
    }

    // Mark as claimed
    await bounty.markAsClaimed(req.user.userId, submissionHash);

    // Populate for response
    await bounty.populate([
      { path: "sponsor", select: "username avatar" },
      { path: "speaker", select: "username avatar" },
      { path: "claimant", select: "username avatar" },
    ]);

    // Emit real-time update
    if (req.app.get("socketio")) {
      req.app.get("socketio").emit("bountyClaimed", {
        bountyId: bounty._id,
        eventId: bounty.event,
        claimant: bounty.claimant.username,
        rewardAmount: bounty.rewardAmount,
        submissionHash,
      });
    }

    res.json({
      success: true,
      message: "Bounty claimed successfully",
      bounty,
    });
  } catch (error) {
    console.error("Claim bounty error:", error);
    next(error);
  }
}

/**
 * Get bounty details
 */
async function getBountyDetails(req, res, next) {
  try {
    const { bountyId } = req.params;

    const bounty = await Bounty.findById(bountyId)
      .populate("sponsor", "username avatar")
      .populate("speaker", "username avatar")
      .populate("event", "name description")
      .populate("claimant", "username avatar");

    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    res.json({ bounty });
  } catch (error) {
    console.error("Get bounty details error:", error);
    next(error);
  }
}

/**
 * Update bounty status (for admin or automated processes)
 */
async function updateBountyStatus(req, res, next) {
  try {
    const { bountyId } = req.params;
    const { status, reason } = req.body;

    const bounty = await Bounty.findById(bountyId);
    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    // Only sponsor or admin can update status
    if (bounty.sponsor.toString() !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const validStatuses = ["active", "claimed", "expired", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    bounty.status = status;
    await bounty.save();

    res.json({
      success: true,
      message: `Bounty status updated to ${status}`,
      bounty,
    });
  } catch (error) {
    console.error("Update bounty status error:", error);
    next(error);
  }
}

module.exports = router;
