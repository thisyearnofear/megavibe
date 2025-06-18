// server/models/tipModel.cjs
const mongoose = require("mongoose");

const tipSchema = new mongoose.Schema(
  {
    // Legacy field - keep for backward compatibility
    songId: { type: String },

    // Enhanced tipping fields
    tipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    speaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Financial data
    amount: {
      type: Number,
      required: true,
      min: 0.01, // Minimum $0.01 USD
    },
    amountUSD: {
      type: Number,
      required: true,
    },
    amountMNT: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    speakerAmount: {
      type: Number,
      required: true,
    },

    // Message and social
    message: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },

    // Blockchain data
    txHash: {
      type: String,
      index: true,
    },
    contractAddress: String,
    blockNumber: Number,
    gasUsed: Number,
    gasPrice: String,

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    // Social features
    socialShared: {
      type: Boolean,
      default: false,
    },
    acknowledgedBySpeaker: {
      type: Boolean,
      default: false,
    },
    speakerResponse: {
      type: String,
      maxlength: 100,
    },

    // Timestamps
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    confirmedAt: Date,
    acknowledgedAt: Date,

    // Analytics
    reactions: {
      likes: { type: Number, default: 0 },
      loves: { type: Number, default: 0 },
      fire: { type: Number, default: 0 },
    },

    // Metadata
    sessionInfo: {
      sessionTitle: String,
      sessionTopic: String,
      venueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Venue",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
tipSchema.index({ event: 1, timestamp: -1 });
tipSchema.index({ recipient: 1, status: 1 });
tipSchema.index({ tipper: 1, timestamp: -1 });
tipSchema.index({ txHash: 1 }, { unique: true, sparse: true });

// Virtual for formatted amount
tipSchema.virtual("formattedAmount").get(function () {
  return `$${this.amountUSD.toFixed(2)}`;
});

// Virtual for time ago
tipSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diffMs = now - this.timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
});

// Method to acknowledge tip
tipSchema.methods.acknowledgeBySpeaker = async function (response = null) {
  this.acknowledgedBySpeaker = true;
  this.acknowledgedAt = new Date();
  if (response) {
    this.speakerResponse = response;
  }
  return this.save();
};

// Method to mark as socially shared
tipSchema.methods.markAsShared = async function () {
  this.socialShared = true;
  return this.save();
};

// Static method to get event tip statistics
tipSchema.statics.getEventStats = async function (eventId) {
  const stats = await this.aggregate([
    { $match: { event: eventId, status: "confirmed" } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountUSD" },
        tipCount: { $sum: 1 },
        avgAmount: { $avg: "$amountUSD" },
        uniqueTippers: { $addToSet: "$tipper" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalAmount: 0,
      tipCount: 0,
      avgAmount: 0,
      uniqueTippers: [],
    }
  );
};

// Static method to get speaker earnings
tipSchema.statics.getSpeakerEarnings = async function (
  speakerId,
  timeframe = "24h",
) {
  const timeAgo = new Date();

  switch (timeframe) {
    case "1h":
      timeAgo.setHours(timeAgo.getHours() - 1);
      break;
    case "24h":
      timeAgo.setHours(timeAgo.getHours() - 24);
      break;
    case "7d":
      timeAgo.setDate(timeAgo.getDate() - 7);
      break;
    case "30d":
      timeAgo.setDate(timeAgo.getDate() - 30);
      break;
    default:
      timeAgo.setHours(timeAgo.getHours() - 24);
  }

  const earnings = await this.aggregate([
    {
      $match: {
        recipient: speakerId,
        status: "confirmed",
        timestamp: { $gte: timeAgo },
      },
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$speakerAmount" },
        tipCount: { $sum: 1 },
        avgTip: { $avg: "$amountUSD" },
      },
    },
  ]);

  return (
    earnings[0] || {
      totalEarnings: 0,
      tipCount: 0,
      avgTip: 0,
    }
  );
};

// Static method to get recent tips for live feed
tipSchema.statics.getRecentTips = async function (eventId, limit = 20) {
  return this.find({
    event: eventId,
    status: "confirmed",
    isPublic: true,
  })
    .populate("tipper", "username avatar")
    .populate("recipient", "username avatar")
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Customize the toJSON method to remove null values and add virtuals
tipSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    Object.keys(ret).forEach((key) =>
      ret[key] === null ? delete ret[key] : {},
    );
    delete ret.__v;
    return ret;
  },
});

const Tip = mongoose.model("Tip", tipSchema);

module.exports = Tip;
