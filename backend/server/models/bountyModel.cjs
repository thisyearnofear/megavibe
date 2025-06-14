const mongoose = require("mongoose");

const bountySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false, // Consider whether this should be required
  },
  songId: {
    type: String,
    required: true,
  },
  venueId: {
    type: String,
    required: true,
  },
  eventId: {
    type: String,
    required: false,
  },
  topic: {
    type: String,
    required: false,
  },
  bountyAmount: {
    type: Number,
    required: true,
  },
  deadline: {
    type: String,
    enum: ["tonight", "this_week", "anytime"],
    default: "anytime",
  },
  message: {
    type: String,
    required: false,
    maxlength: 200,
  },
  status: {
    type: String,
    enum: ["active", "claimed", "completed", "cancelled"],
    default: "active",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  evidenceUrl: {
    type: String,
    required: false,
  },
  votesFor: {
    type: Number,
    default: 0,
  },
  votesAgainst: {
    type: Number,
    default: 0,
  },
  blockchainTransactionId: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Bounty = mongoose.model("Bounty", bountySchema);

module.exports = Bounty;
