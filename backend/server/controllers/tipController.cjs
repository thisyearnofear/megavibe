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
const {
  APIError,
  catchAsync,
  validateRequired,
  sendResponse,
  logger,
} = require("../middleware/errorHandler.cjs");

// Create a new crypto tip
router.post("/create", [validateUserSession, catchAsync(createCryptoTip)]);

// Confirm tip transaction
router.post("/confirm", [validateUserSession, catchAsync(confirmTip)]);

// Get tips for an event
router.get("/event/:eventId", catchAsync(getEventTips));

// Get speaker earnings
router.get("/speaker/:speakerId/earnings", catchAsync(getSpeakerEarnings));

// Acknowledge tip (speakers only)
router.post("/:tipId/acknowledge", [
  validateUserSession,
  catchAsync(acknowledgeTip),
]);

// Get live tip feed for event
router.get("/event/:eventId/live", catchAsync(getLiveTipFeed));

// Health check endpoint
router.get("/health", (req, res) => {
  sendResponse(res, 200, { status: "healthy" }, "Tip service is running");
});

// Legacy routes for backward compatibility
router.get("/", catchAsync(getTips));
router.get("/:tipId", catchAsync(getTipById));
router.put("/:tipId", [validateUserSession, catchAsync(updateTip)]);
router.delete("/:tipId", [validateUserSession, catchAsync(deleteTip)]);

// Create new crypto tip transaction
async function createCryptoTip(req, res) {
  const { speakerId, eventId, amountUSD, message } = req.body;

  // Validate required fields
  validateRequired(["speakerId", "eventId", "amountUSD"], req.body);

  // Validate amount
  if (amountUSD <= 0) {
    throw new APIError("Amount must be greater than 0", 400);
  }

  if (amountUSD > 10000) {
    throw new APIError("Amount cannot exceed $10,000", 400);
  }

  // Validate speaker exists
  const speaker = await User.findById(speakerId);
  if (!speaker) {
    throw new APIError("Speaker not found", 404);
  }

  if (!speaker.walletAddress) {
    throw new APIError("Speaker has no wallet address configured", 400);
  }

  // Validate event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new APIError("Event not found", 404);
  }

  // Check if event is active
  const now = new Date();
  if (event.endTime && new Date(event.endTime) < now) {
    throw new APIError("Cannot tip for ended events", 400);
  }

  // Validate message length
  if (message && message.length > 500) {
    throw new APIError("Message cannot exceed 500 characters", 400);
  }

  // Calculate platform fee (5%)
  const platformFee = Math.round(amountUSD * 0.05 * 100) / 100; // Round to 2 decimals
  const speakerAmount = Math.round((amountUSD - platformFee) * 100) / 100;

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
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
  });

  await tip.save();

  logger.info(
    `Tip created: ${tip._id} for speaker ${speakerId} amount $${amountUSD}`
  );

  sendResponse(
    res,
    201,
    {
      tipId: tip._id,
      speakerWallet: speaker.walletAddress,
      contractAddress: process.env.TIPPING_CONTRACT_ADDRESS,
      amountUSD: amountUSD,
      speakerAmount: speakerAmount,
      platformFee: platformFee,
      expiresAt: tip.expiresAt,
    },
    "Tip created successfully"
  );
}

// Confirm tip transaction with blockchain hash
async function confirmTip(req, res) {
  const { tipId, txHash, amountMNT, blockNumber, gasUsed } = req.body;

  validateRequired(["tipId", "txHash"], req.body);

  // Validate transaction hash format
  if (!ethers.isHexString(txHash, 32)) {
    throw new APIError("Invalid transaction hash format", 400);
  }

  const tip = await Tip.findById(tipId);
  if (!tip) {
    throw new APIError("Tip not found", 404);
  }

  if (tip.tipper.toString() !== req.user.userId) {
    throw new APIError("Unauthorized to confirm this tip", 403);
  }

  if (tip.status === "confirmed") {
    throw new APIError("Tip already confirmed", 400);
  }

  if (tip.status === "expired") {
    throw new APIError("Tip has expired", 400);
  }

  // Check if tip has expired
  if (tip.expiresAt && new Date() > tip.expiresAt) {
    tip.status = "expired";
    await tip.save();
    throw new APIError("Tip has expired", 400);
  }

  // Validate amounts if provided
  if (amountMNT && amountMNT <= 0) {
    throw new APIError("Invalid MNT amount", 400);
  }

  // Update tip with blockchain data
  tip.status = "confirmed";
  tip.txHash = txHash;
  tip.amountMNT = amountMNT || 0;
  tip.blockNumber = blockNumber;
  tip.gasUsed = gasUsed;
  tip.confirmedAt = new Date();

  await tip.save();

  // Populate tip data for response
  await tip.populate([
    { path: "tipper", select: "username avatar" },
    { path: "recipient", select: "username avatar" },
  ]);

  logger.info(`Tip confirmed: ${tip._id} with tx ${txHash}`);

  // Emit real-time update (if socket.io is available)
  if (req.app.get("socketio")) {
    req.app.get("socketio").emit("tipConfirmed", {
      tipId: tip._id,
      eventId: tip.event,
      speakerId: tip.recipient,
      amount: tip.amountUSD,
      message: tip.message,
      tipper: tip.tipper.username || "Anonymous",
      timestamp: tip.confirmedAt,
    });
  }

  sendResponse(res, 200, { tip }, "Tip confirmed successfully");
}

// Get tips for an event
async function getEventTips(req, res) {
  const { eventId } = req.params;
  const { limit = 50, offset = 0, status = "confirmed" } = req.query;

  // Validate eventId
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new APIError("Invalid event ID", 400);
  }

  // Validate pagination parameters
  const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 tips
  const offsetNum = Math.max(parseInt(offset) || 0, 0);

  const query = {
    event: eventId,
    isPublic: true,
  };

  if (status) {
    query.status = status;
  }

  const tips = await Tip.find(query)
    .populate("tipper", "username avatar")
    .populate("recipient", "username avatar")
    .sort({ confirmedAt: -1 })
    .skip(offsetNum)
    .limit(limitNum)
    .lean(); // Use lean for better performance

  // Get total count for pagination
  const total = await Tip.countDocuments(query);

  // Get event statistics
  const stats = await Tip.aggregate([
    {
      $match: {
        event: new mongoose.Types.ObjectId(eventId),
        status: "confirmed",
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountUSD" },
        totalTips: { $sum: 1 },
        avgAmount: { $avg: "$amountUSD" },
        maxAmount: { $max: "$amountUSD" },
      },
    },
  ]);

  sendResponse(res, 200, {
    tips,
    stats: stats[0] || {
      totalAmount: 0,
      totalTips: 0,
      avgAmount: 0,
      maxAmount: 0,
    },
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    },
  });
}

// Get speaker earnings
async function getSpeakerEarnings(req, res) {
  const { speakerId } = req.params;
  const { timeframe = "24h" } = req.query;

  if (!mongoose.Types.ObjectId.isValid(speakerId)) {
    throw new APIError("Invalid speaker ID", 400);
  }

  // Calculate time range
  const now = new Date();
  let startTime;

  switch (timeframe) {
    case "1h":
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "24h":
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const earnings = await Tip.aggregate([
    {
      $match: {
        recipient: new mongoose.Types.ObjectId(speakerId),
        status: "confirmed",
        confirmedAt: { $gte: startTime },
      },
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$speakerAmount" },
        totalTips: { $sum: 1 },
        avgTip: { $avg: "$speakerAmount" },
        maxTip: { $max: "$speakerAmount" },
      },
    },
  ]);

  // Get pending withdrawable balance (all time)
  const pendingTips = await Tip.aggregate([
    {
      $match: {
        recipient: new mongoose.Types.ObjectId(speakerId),
        status: "confirmed",
      },
    },
    {
      $group: {
        _id: null,
        withdrawableBalance: { $sum: "$speakerAmount" },
        totalLifetimeEarnings: { $sum: "$speakerAmount" },
        totalLifetimeTips: { $sum: 1 },
      },
    },
  ]);

  const result = earnings[0] || {
    totalEarnings: 0,
    totalTips: 0,
    avgTip: 0,
    maxTip: 0,
  };
  const lifetime = pendingTips[0] || {
    withdrawableBalance: 0,
    totalLifetimeEarnings: 0,
    totalLifetimeTips: 0,
  };

  sendResponse(res, 200, {
    timeframe,
    period: {
      ...result,
      startTime,
      endTime: now,
    },
    lifetime,
  });
}

// Acknowledge tip (speakers only)
async function acknowledgeTip(req, res) {
  const { tipId } = req.params;
  const { response } = req.body;

  if (!mongoose.Types.ObjectId.isValid(tipId)) {
    throw new APIError("Invalid tip ID", 400);
  }

  const tip = await Tip.findById(tipId);
  if (!tip) {
    throw new APIError("Tip not found", 404);
  }

  if (tip.recipient.toString() !== req.user.userId) {
    throw new APIError("Only the tip recipient can acknowledge", 403);
  }

  if (tip.status !== "confirmed") {
    throw new APIError("Can only acknowledge confirmed tips", 400);
  }

  if (tip.acknowledgedAt) {
    throw new APIError("Tip already acknowledged", 400);
  }

  // Validate response message
  if (response && response.length > 200) {
    throw new APIError("Response message cannot exceed 200 characters", 400);
  }

  tip.acknowledgedAt = new Date();
  tip.acknowledgmentMessage = response || "Thank you!";
  await tip.save();

  logger.info(`Tip acknowledged: ${tip._id} by speaker ${req.user.userId}`);

  // Emit real-time update
  if (req.app.get("socketio")) {
    req.app.get("socketio").emit("tipAcknowledged", {
      tipId: tip._id,
      eventId: tip.event,
      response: tip.acknowledgmentMessage,
      speakerName: req.user.username,
      timestamp: tip.acknowledgedAt,
    });
  }

  sendResponse(res, 200, { tip }, "Tip acknowledged successfully");
}

// Get live tip feed for event
async function getLiveTipFeed(req, res) {
  const { eventId } = req.params;
  const { limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new APIError("Invalid event ID", 400);
  }

  const limitNum = Math.min(parseInt(limit) || 20, 50); // Max 50 tips

  const tips = await Tip.find({
    event: eventId,
    status: "confirmed",
    isPublic: true,
  })
    .populate("tipper", "username avatar")
    .populate("recipient", "username avatar")
    .sort({ confirmedAt: -1 })
    .limit(limitNum)
    .lean();

  sendResponse(res, 200, {
    tips,
    lastUpdate: new Date().toISOString(),
    count: tips.length,
  });
}

// Legacy function - keep for backward compatibility
async function getTips(req, res) {
  const { limit = 100, status = "confirmed" } = req.query;
  const limitNum = Math.min(parseInt(limit) || 100, 200);

  const tips = await Tip.find({ status })
    .populate("tipper", "username")
    .populate("recipient", "username")
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .lean();

  sendResponse(res, 200, { tips, count: tips.length });
}

async function getTipById(req, res) {
  const { tipId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tipId)) {
    throw new APIError("Invalid tip ID", 400);
  }

  const tip = await Tip.findById(tipId)
    .populate("tipper", "username avatar")
    .populate("recipient", "username avatar")
    .lean();

  if (!tip) {
    throw new APIError("Tip not found", 404);
  }

  sendResponse(res, 200, { tip });
}

async function updateTip(req, res) {
  const { tipId } = req.params;
  const { message } = req.body;

  if (!mongoose.Types.ObjectId.isValid(tipId)) {
    throw new APIError("Invalid tip ID", 400);
  }

  const tip = await Tip.findById(tipId);
  if (!tip) {
    throw new APIError("Tip not found", 404);
  }

  // Only allow tipper to update their own tips
  if (tip.tipper.toString() !== req.user.userId) {
    throw new APIError("Unauthorized to update this tip", 403);
  }

  // Only allow updates to pending tips
  if (tip.status !== "pending") {
    throw new APIError("Can only update pending tips", 400);
  }

  // Validate message
  if (message && message.length > 500) {
    throw new APIError("Message cannot exceed 500 characters", 400);
  }

  tip.message = message || tip.message;
  tip.updatedAt = new Date();
  await tip.save();

  sendResponse(res, 200, { tip }, "Tip updated successfully");
}

async function deleteTip(req, res) {
  const { tipId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tipId)) {
    throw new APIError("Invalid tip ID", 400);
  }

  const tip = await Tip.findById(tipId);
  if (!tip) {
    throw new APIError("Tip not found", 404);
  }

  // Only allow tipper to delete their own tips
  if (tip.tipper.toString() !== req.user.userId) {
    throw new APIError("Unauthorized to delete this tip", 403);
  }

  // Only allow deletion of pending tips
  if (tip.status !== "pending") {
    throw new APIError("Can only delete pending tips", 400);
  }

  await Tip.findByIdAndDelete(tipId);

  logger.info(`Tip deleted: ${tipId} by user ${req.user.userId}`);

  sendResponse(res, 200, null, "Tip deleted successfully");
}

module.exports = router;
