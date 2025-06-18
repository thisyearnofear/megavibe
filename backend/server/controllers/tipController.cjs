const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Tip = require("../models/tipModel.cjs");
const User = require("../models/userModel.cjs");
const Event = require("../models/eventModel.cjs");
const Venue = require("../models/venueModel.cjs");
const { ethers } = require("ethers");
const {
  validateUserSession,
} = require("../middleware/validationMiddleware.cjs");

// Create a new crypto tip
router.post("/create", [validateUserSession, createCryptoTip]);

// Confirm tip transaction
router.post("/confirm", [validateUserSession, confirmTip]);

// Get tips for an event
router.get("/event/:eventId", getEventTips);

// Get speaker earnings
router.get("/speaker/:speakerId/earnings", getSpeakerEarnings);

// Acknowledge tip (speakers only)
router.post("/:tipId/acknowledge", [validateUserSession, acknowledgeTip]);

// Get live tip feed for event
router.get("/event/:eventId/live", getLiveTipFeed);

// Legacy routes for backward compatibility
router.get("/", getTips);
router.get("/:tipId", getTipById);
router.put("/:tipId", updateTip);
router.delete("/:tipId", deleteTip);

// Create new crypto tip transaction
async function createCryptoTip(req, res, next) {
  try {
    const { speakerId, eventId, amountUSD, message } = req.body;

    // Validate required fields
    if (!speakerId || !eventId || !amountUSD) {
      return res.status(400).json({
        error: "Speaker ID, Event ID, and amount are required",
      });
    }

    // Validate speaker exists
    const speaker = await User.findById(speakerId);
    if (!speaker) {
      return res.status(404).json({ error: "Speaker not found" });
    }

    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Calculate platform fee (5%)
    const platformFee = amountUSD * 0.05;
    const speakerAmount = amountUSD - platformFee;

    // Create pending tip record
    const tip = new Tip({
      tipper: req.user.userId,
      recipient: speakerId,
      speaker: speakerId,
      event: eventId,
      amount: amountUSD,
      amountUSD: amountUSD,
      amountMNT: 0, // Will be calculated on frontend
      platformFee: platformFee,
      speakerAmount: speakerAmount,
      message: message || "",
      status: "pending",
      contractAddress: process.env.TIPPING_CONTRACT_ADDRESS,
    });

    await tip.save();

    res.status(201).json({
      tipId: tip._id,
      speakerWallet: speaker.walletAddress,
      contractAddress: process.env.TIPPING_CONTRACT_ADDRESS,
      amountUSD: amountUSD,
      speakerAmount: speakerAmount,
      platformFee: platformFee,
    });
  } catch (error) {
    console.error("Create tip error:", error);
    next(error);
  }
}

// Confirm tip transaction with blockchain hash
async function confirmTip(req, res, next) {
  try {
    const { tipId, txHash, amountMNT, blockNumber, gasUsed } = req.body;

    if (!tipId || !txHash) {
      return res
        .status(400)
        .json({ error: "Tip ID and transaction hash required" });
    }

    const tip = await Tip.findById(tipId);
    if (!tip) {
      return res.status(404).json({ error: "Tip not found" });
    }

    if (tip.tipper.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update tip with blockchain data
    tip.status = "confirmed";
    tip.txHash = txHash;
    tip.amountMNT = amountMNT || 0;
    tip.blockNumber = blockNumber;
    tip.gasUsed = gasUsed;
    tip.confirmedAt = new Date();

    await tip.save();

    // Emit real-time update (if socket.io is available)
    if (req.app.get("socketio")) {
      req.app.get("socketio").emit("tipConfirmed", {
        tipId: tip._id,
        eventId: tip.event,
        speakerId: tip.recipient,
        amount: tip.amountUSD,
        message: tip.message,
        tipper: req.user.username || "Anonymous",
      });
    }

    res.json({
      success: true,
      message: "Tip confirmed successfully",
      tip: tip,
    });
  } catch (error) {
    console.error("Confirm tip error:", error);
    next(error);
  }
}

// Get tips for an event
async function getEventTips(req, res, next) {
  try {
    const { eventId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const tips = await Tip.find({
      event: eventId,
      status: "confirmed",
      isPublic: true,
    })
      .populate("tipper", "username avatar")
      .populate("recipient", "username avatar")
      .sort({ confirmedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Get event statistics
    const stats = await Tip.getEventStats(eventId);

    res.json({
      tips,
      stats,
      total: tips.length,
    });
  } catch (error) {
    console.error("Get event tips error:", error);
    next(error);
  }
}

// Get speaker earnings
async function getSpeakerEarnings(req, res, next) {
  try {
    const { speakerId } = req.params;
    const { timeframe = "24h" } = req.query;

    const earnings = await Tip.getSpeakerEarnings(speakerId, timeframe);

    // Get pending withdrawable balance
    const pendingTips = await Tip.find({
      recipient: speakerId,
      status: "confirmed",
    });

    const withdrawableBalance = pendingTips.reduce(
      (sum, tip) => sum + tip.speakerAmount,
      0,
    );

    res.json({
      ...earnings,
      withdrawableBalance,
      timeframe,
    });
  } catch (error) {
    console.error("Get speaker earnings error:", error);
    next(error);
  }
}

// Acknowledge tip (speakers only)
async function acknowledgeTip(req, res, next) {
  try {
    const { tipId } = req.params;
    const { response } = req.body;

    const tip = await Tip.findById(tipId);
    if (!tip) {
      return res.status(404).json({ error: "Tip not found" });
    }

    if (tip.recipient.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Only the tip recipient can acknowledge" });
    }

    await tip.acknowledgeBySpeaker(response);

    // Emit real-time update
    if (req.app.get("socketio")) {
      req.app.get("socketio").emit("tipAcknowledged", {
        tipId: tip._id,
        eventId: tip.event,
        response: response || "Thank you!",
        speakerName: req.user.username,
      });
    }

    res.json({
      success: true,
      message: "Tip acknowledged successfully",
    });
  } catch (error) {
    console.error("Acknowledge tip error:", error);
    next(error);
  }
}

// Get live tip feed for event
async function getLiveTipFeed(req, res, next) {
  try {
    const { eventId } = req.params;
    const { limit = 20 } = req.query;

    const tips = await Tip.getRecentTips(eventId, parseInt(limit));

    res.json({
      tips,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get live tip feed error:", error);
    next(error);
  }
}

// Legacy function - keep for backward compatibility
async function getTips(req, res, next) {
  try {
    const tips = await Tip.find()
      .populate("tipper", "username")
      .populate("recipient", "username")
      .sort({ timestamp: -1 })
      .limit(100);
    res.status(200).json(tips);
  } catch (error) {
    next(error);
  }
}

async function getTipById(req, res, next) {
  const { tipId } = req.params;
  try {
    const tip = await Tip.findById(tipId);
    if (!tip) {
      res.status(404).json({ message: "Tip not found" });
    } else {
      res.status(200).json(tip);
    }
  } catch (error) {
    next(error);
  }
}

async function updateTip(req, res, next) {
  const { tipId } = req.params;
  const { songId, amount } = req.body;
  try {
    const tip = await Tip.findByIdAndUpdate(
      tipId,
      { songId, amount },
      { new: true },
    );
    if (!tip) {
      res.status(404).json({ message: "Tip not found" });
    } else {
      res.status(200).json({ message: "Tip updated successfully", tip });
    }
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      res.status(404).json({ message: "Tip not found" });
    } else {
      next(error);
    }
  }
}

async function deleteTip(req, res, next) {
  const { tipId } = req.params;
  try {
    const tip = await Tip.findByIdAndDelete(tipId);
    if (!tip) {
      res.status(404).json({ message: "Tip not found" });
    } else {
      res.status(200).json({ message: "Tip deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = router;
