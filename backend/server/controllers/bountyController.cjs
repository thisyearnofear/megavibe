const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Bounty = require("../models/bountyModel.cjs");
const User = require("../models/userModel.cjs");
const Event = require("../models/eventModel.cjs");
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

// Create a new bounty
router.post("/", [validateUserSession, catchAsync(createBounty)]);

// Get bounties with filtering and pagination
router.get("/", catchAsync(getBounties));

// Get bounty by ID
router.get("/:bountyId", catchAsync(getBountyById));

// Update bounty (creator only)
router.put("/:bountyId", [validateUserSession, catchAsync(updateBounty)]);

// Delete bounty (creator only)
router.delete("/:bountyId", [validateUserSession, catchAsync(deleteBounty)]);

// Claim a bounty
router.post("/:bountyId/claim", [validateUserSession, catchAsync(claimBounty)]);

// Submit work for a bounty
router.post("/:bountyId/submit", [
  validateUserSession,
  catchAsync(submitBountyWork),
]);

// Approve bounty submission (creator only)
router.post("/:bountyId/approve", [
  validateUserSession,
  catchAsync(approveBountySubmission),
]);

// Reject bounty submission (creator only)
router.post("/:bountyId/reject", [
  validateUserSession,
  catchAsync(rejectBountySubmission),
]);

// Get bounties for an event
router.get("/event/:eventId", catchAsync(getEventBounties));

// Get bounties for a speaker
router.get("/speaker/:speakerId", catchAsync(getSpeakerBounties));

// Get user's created bounties
router.get("/user/:userId/created", catchAsync(getUserCreatedBounties));

// Get user's claimed bounties
router.get("/user/:userId/claimed", catchAsync(getUserClaimedBounties));

// Health check
router.get("/health", (req, res) => {
  sendResponse(res, 200, { status: "healthy" }, "Bounty service is running");
});

// Create a new bounty
async function createBounty(req, res) {
  const {
    eventId,
    speakerId,
    title,
    description,
    reward,
    deadline,
    requirements,
    category,
    deliverables,
  } = req.body;

  // Validate required fields
  validateRequired(
    ["eventId", "speakerId", "title", "description", "reward", "deadline"],
    req.body
  );

  // Validate reward amount
  if (reward <= 0) {
    throw new APIError("Reward must be greater than 0", 400);
  }

  if (reward > 50000) {
    throw new APIError("Reward cannot exceed $50,000", 400);
  }

  // Validate deadline
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const maxDeadline = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  if (deadlineDate <= now) {
    throw new APIError("Deadline must be in the future", 400);
  }

  if (deadlineDate > maxDeadline) {
    throw new APIError(
      "Deadline cannot be more than 90 days in the future",
      400
    );
  }

  // Validate title and description length
  if (title.length > 200) {
    throw new APIError("Title cannot exceed 200 characters", 400);
  }

  if (description.length > 2000) {
    throw new APIError("Description cannot exceed 2000 characters", 400);
  }

  // Validate event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new APIError("Event not found", 404);
  }

  // Validate speaker exists
  const speaker = await User.findById(speakerId);
  if (!speaker) {
    throw new APIError("Speaker not found", 404);
  }

  if (!speaker.walletAddress) {
    throw new APIError("Speaker has no wallet address configured", 400);
  }

  // Calculate platform fee (5%)
  const platformFee = Math.round(reward * 0.05 * 100) / 100;
  const speakerAmount = Math.round((reward - platformFee) * 100) / 100;

  // Create bounty
  const bounty = new Bounty({
    creator: req.user.userId,
    event: eventId,
    speaker: speakerId,
    title: title.trim(),
    description: description.trim(),
    reward,
    platformFee,
    speakerAmount,
    deadline: deadlineDate,
    requirements: requirements || [],
    category: category || "general",
    deliverables: deliverables || [],
    status: "open",
    contractAddress: process.env.BOUNTY_CONTRACT_ADDRESS,
    createdAt: new Date(),
  });

  await bounty.save();

  // Populate for response
  await bounty.populate([
    { path: "creator", select: "username avatar" },
    { path: "speaker", select: "username avatar walletAddress" },
    { path: "event", select: "name startTime endTime" },
  ]);

  logger.info(
    `Bounty created: ${bounty._id} by user ${req.user.userId} for speaker ${speakerId}`
  );

  // Emit real-time update
  if (req.app.get("socketio")) {
    req.app.get("socketio").emit("bountyCreated", {
      bountyId: bounty._id,
      eventId: bounty.event._id,
      speakerId: bounty.speaker._id,
      title: bounty.title,
      reward: bounty.reward,
      creator: bounty.creator.username,
      timestamp: bounty.createdAt,
    });
  }

  sendResponse(res, 201, { bounty }, "Bounty created successfully");
}

// Get bounties with filtering and pagination
async function getBounties(req, res) {
  const {
    limit = 20,
    offset = 0,
    status = "open",
    category,
    eventId,
    speakerId,
    minReward,
    maxReward,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Validate pagination
  const limitNum = Math.min(parseInt(limit) || 20, 100);
  const offsetNum = Math.max(parseInt(offset) || 0, 0);

  // Build query
  const query = {};

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new APIError("Invalid event ID", 400);
    }
    query.event = eventId;
  }

  if (speakerId) {
    if (!mongoose.Types.ObjectId.isValid(speakerId)) {
      throw new APIError("Invalid speaker ID", 400);
    }
    query.speaker = speakerId;
  }

  if (minReward || maxReward) {
    query.reward = {};
    if (minReward) query.reward.$gte = parseFloat(minReward);
    if (maxReward) query.reward.$lte = parseFloat(maxReward);
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const bounties = await Bounty.find(query)
    .populate("creator", "username avatar")
    .populate("speaker", "username avatar")
    .populate("event", "name startTime endTime")
    .populate("claimedBy", "username avatar")
    .sort(sort)
    .skip(offsetNum)
    .limit(limitNum)
    .lean();

  const total = await Bounty.countDocuments(query);

  // Get statistics
  const stats = await Bounty.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalReward: { $sum: "$reward" },
        avgReward: { $avg: "$reward" },
        maxReward: { $max: "$reward" },
        minReward: { $min: "$reward" },
      },
    },
  ]);

  sendResponse(res, 200, {
    bounties,
    stats: stats[0] || {
      totalReward: 0,
      avgReward: 0,
      maxReward: 0,
      minReward: 0,
    },
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    },
  });
}

// Get bounty by ID
async function getBountyById(req, res) {
  const { bountyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bountyId)) {
    throw new APIError("Invalid bounty ID", 400);
  }

  const bounty = await Bounty.findById(bountyId)
    .populate("creator", "username avatar")
    .populate("speaker", "username avatar walletAddress")
    .populate("event", "name startTime endTime venue")
    .populate("claimedBy", "username avatar")
    .populate("submissions.submitter", "username avatar")
    .lean();

  if (!bounty) {
    throw new APIError("Bounty not found", 404);
  }

  sendResponse(res, 200, { bounty });
}

// Update bounty (creator only)
async function updateBounty(req, res) {
  const { bountyId } = req.params;
  const { title, description, requirements, deliverables } = req.body;

  if (!mongoose.Types.ObjectId.isValid(bountyId)) {
    throw new APIError("Invalid bounty ID", 400);
  }

  const bounty = await Bounty.findById(bountyId);
  if (!bounty) {
    throw new APIError("Bounty not found", 404);
  }

  if (bounty.creator.toString() !== req.user.userId) {
    throw new APIError("Only the bounty creator can update it", 403);
  }

  if (bounty.status !== "open") {
    throw new APIError("Can only update open bounties", 400);
  }

  // Validate updates
  if (title && title.length > 200) {
    throw new APIError("Title cannot exceed 200 characters", 400);
  }

  if (description && description.length > 2000) {
    throw new APIError("Description cannot exceed 2000 characters", 400);
  }

  // Update fields
  if (title) bounty.title = title.trim();
  if (description) bounty.description = description.trim();
  if (requirements) bounty.requirements = requirements;
  if (deliverables) bounty.deliverables = deliverables;
  bounty.updatedAt = new Date();

  await bounty.save();

  logger.info(`Bounty updated: ${bountyId} by user ${req.user.userId}`);

  sendResponse(res, 200, { bounty }, "Bounty updated successfully");
}

// Delete bounty (creator only)
async function deleteBounty(req, res) {
  const { bountyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bountyId)) {
    throw new APIError("Invalid bounty ID", 400);
  }

  const bounty = await Bounty.findById(bountyId);
  if (!bounty) {
    throw new APIError("Bounty not found", 404);
  }

  if (bounty.creator.toString() !== req.user.userId) {
    throw new APIError("Only the bounty creator can delete it", 403);
  }

  if (bounty.status !== "open") {
    throw new APIError("Can only delete open bounties", 400);
  }

  if (bounty.claimedBy) {
    throw new APIError("Cannot delete claimed bounties", 400);
  }

  await Bounty.findByIdAndDelete(bountyId);

  logger.info(`Bounty deleted: ${bountyId} by user ${req.user.userId}`);

  sendResponse(res, 200, null, "Bounty deleted successfully");
}

// Claim a bounty
async function claimBounty(req, res) {
  const { bountyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bountyId)) {
    throw new APIError("Invalid bounty ID", 400);
  }

  const bounty = await Bounty.findById(bountyId);
  if (!bounty) {
    throw new APIError("Bounty not found", 404);
  }

  if (bounty.status !== "open") {
    throw new APIError("Bounty is not available for claiming", 400);
  }

  if (bounty.creator.toString() === req.user.userId) {
    throw new APIError("Cannot claim your own bounty", 400);
  }

  if (bounty.claimedBy) {
    throw new APIError("Bounty already claimed", 400);
  }

  // Check deadline
  if (new Date() > bounty.deadline) {
    bounty.status = "expired";
    await bounty.save();
    throw new APIError("Bounty has expired", 400);
  }

  // Claim the bounty
  bounty.claimedBy = req.user.userId;
  bounty.claimedAt = new Date();
  bounty.status = "claimed";

  await bounty.save();

  logger.info(`Bounty claimed: ${bountyId} by user ${req.user.userId}`);

  // Emit real-time update
  if (req.app.get("socketio")) {
    req.app.get("socketio").emit("bountyClaimed", {
      bountyId: bounty._id,
      claimedBy: req.user.username,
      timestamp: bounty.claimedAt,
    });
  }

  sendResponse(res, 200, { bounty }, "Bounty claimed successfully");
}

// Submit work for a bounty
async function submitBountyWork(req, res) {
  const { bountyId } = req.params;
  const { submissionUrl, description, notes } = req.body;

  validateRequired(["submissionUrl", "description"], req.body);

  if (!mongoose.Types.ObjectId.isValid(bountyId)) {
    throw new APIError("Invalid bounty ID", 400);
  }

  const bounty = await Bounty.findById(bountyId);
  if (!bounty) {
    throw new APIError("Bounty not found", 404);
  }

  if (!bounty.claimedBy || bounty.claimedBy.toString() !== req.user.userId) {
    throw new APIError(
      "You must claim this bounty before submitting work",
      403
    );
  }

  if (bounty.status !== "claimed") {
    throw new APIError("Bounty is not in a claimable state", 400);
  }

  // Validate submission
  if (description.length > 1000) {
    throw new APIError("Description cannot exceed 1000 characters", 400);
  }

  // Add submission
  const submission = {
    submitter: req.user.userId,
    submissionUrl: submissionUrl.trim(),
    description: description.trim(),
    notes: notes ? notes.trim() : "",
    submittedAt: new Date(),
    status: "pending",
  };

  bounty.submissions.push(submission);
  bounty.status = "submitted";
  bounty.submittedAt = new Date();

  await bounty.save();

  logger.info(`Bounty work submitted: ${bountyId} by user ${req.user.userId}`);

  // Emit real-time update
  if (req.app.get("socketio")) {
    req.app.get("socketio").emit("bountySubmitted", {
      bountyId: bounty._id,
      submitter: req.user.username,
      timestamp: submission.submittedAt,
    });
  }

  sendResponse(res, 200, { bounty }, "Work submitted successfully");
}

// Approve bounty submission (creator only)
async function approveBountySubmission(req, res) {
  const { bountyId } = req.params;
  const { submissionId, feedback, txHash } = req.body;

  validateRequired(["submissionId"], req.body);

  if (!mongoose.Types.ObjectId.isValid(bountyId)) {
    throw new APIError("Invalid bounty ID", 400);
  }

  const bounty = await Bounty.findById(bountyId);
  if (!bounty) {
    throw new APIError("Bounty not found", 404);
  }

  if (bounty.creator.toString() !== req.user.userId) {
    throw new APIError("Only the bounty creator can approve submissions", 403);
  }

  const submission = bounty.submissions.id(submissionId);
  if (!submission) {
    throw new APIError("Submission not found", 404);
  }

  if (submission.status !== "pending") {
    throw new APIError("Submission already processed", 400);
  }

  // Approve submission
  submission.status = "approved";
  submission.approvedAt = new Date();
  submission.feedback = feedback || "";

  bounty.status = "completed";
  bounty.completedAt = new Date();

  if (txHash) {
    bounty.txHash = txHash;
  }

  await bounty.save();

  logger.info(
    `Bounty approved: ${bountyId} submission ${submissionId} by user ${req.user.userId}`
  );

  // Emit real-time update
  if (req.app.get("socketio")) {
    req.app.get("socketio").emit("bountyCompleted", {
      bountyId: bounty._id,
      completedBy: bounty.claimedBy,
      reward: bounty.speakerAmount,
      timestamp: bounty.completedAt,
    });
  }

  sendResponse(res, 200, { bounty }, "Submission approved successfully");
}

// Reject bounty submission (creator only)
async function rejectBountySubmission(req, res) {
  const { bountyId } = req.params;
  const { submissionId, feedback } = req.body;

  validateRequired(["submissionId", "feedback"], req.body);

  if (!mongoose.Types.ObjectId.isValid(bountyId)) {
    throw new APIError("Invalid bounty ID", 400);
  }

  const bounty = await Bounty.findById(bountyId);
  if (!bounty) {
    throw new APIError("Bounty not found", 404);
  }

  if (bounty.creator.toString() !== req.user.userId) {
    throw new APIError("Only the bounty creator can reject submissions", 403);
  }

  const submission = bounty.submissions.id(submissionId);
  if (!submission) {
    throw new APIError("Submission not found", 404);
  }

  if (submission.status !== "pending") {
    throw new APIError("Submission already processed", 400);
  }

  // Reject submission
  submission.status = "rejected";
  submission.rejectedAt = new Date();
  submission.feedback = feedback;

  bounty.status = "claimed"; // Back to claimed status

  await bounty.save();

  logger.info(
    `Bounty submission rejected: ${bountyId} submission ${submissionId} by user ${req.user.userId}`
  );

  sendResponse(res, 200, { bounty }, "Submission rejected");
}

// Get bounties for an event
async function getEventBounties(req, res) {
  const { eventId } = req.params;
  const { status = "open", limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new APIError("Invalid event ID", 400);
  }

  const limitNum = Math.min(parseInt(limit) || 20, 50);

  const bounties = await Bounty.find({ event: eventId, status })
    .populate("creator", "username avatar")
    .populate("speaker", "username avatar")
    .populate("claimedBy", "username avatar")
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .lean();

  sendResponse(res, 200, { bounties, count: bounties.length });
}

// Get bounties for a speaker
async function getSpeakerBounties(req, res) {
  const { speakerId } = req.params;
  const { status, limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(speakerId)) {
    throw new APIError("Invalid speaker ID", 400);
  }

  const limitNum = Math.min(parseInt(limit) || 20, 50);
  const query = { speaker: speakerId };

  if (status) {
    query.status = status;
  }

  const bounties = await Bounty.find(query)
    .populate("creator", "username avatar")
    .populate("claimedBy", "username avatar")
    .populate("event", "name startTime endTime")
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .lean();

  sendResponse(res, 200, { bounties, count: bounties.length });
}

// Get user's created bounties
async function getUserCreatedBounties(req, res) {
  const { userId } = req.params;
  const { status, limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new APIError("Invalid user ID", 400);
  }

  const limitNum = Math.min(parseInt(limit) || 20, 50);
  const query = { creator: userId };

  if (status) {
    query.status = status;
  }

  const bounties = await Bounty.find(query)
    .populate("speaker", "username avatar")
    .populate("claimedBy", "username avatar")
    .populate("event", "name startTime endTime")
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .lean();

  sendResponse(res, 200, { bounties, count: bounties.length });
}

// Get user's claimed bounties
async function getUserClaimedBounties(req, res) {
  const { userId } = req.params;
  const { status, limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new APIError("Invalid user ID", 400);
  }

  const limitNum = Math.min(parseInt(limit) || 20, 50);
  const query = { claimedBy: userId };

  if (status) {
    query.status = status;
  }

  const bounties = await Bounty.find(query)
    .populate("creator", "username avatar")
    .populate("speaker", "username avatar")
    .populate("event", "name startTime endTime")
    .sort({ claimedAt: -1 })
    .limit(limitNum)
    .lean();

  sendResponse(res, 200, { bounties, count: bounties.length });
}

module.exports = router;
