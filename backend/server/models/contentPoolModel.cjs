const mongoose = require("mongoose");

const contentPoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxLength: 100,
    },
    description: {
      type: String,
      maxLength: 500,
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: false,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: false,
      index: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    snippets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AudioSnippet",
      },
    ],
    contributionFee: {
      type: Number,
      default: 0.1, // Default fee in USD or token amount for contributing a snippet
    },
    totalContributions: {
      type: Number,
      default: 0, // Total fees collected from contributions
    },
    totalSnippets: {
      type: Number,
      default: 0, // Total number of snippets in the pool
    },
    totalEarnings: {
      type: Number,
      default: 0, // Total earnings from usage or sales of pool content
    },
    isPremium: {
      type: Boolean,
      default: false, // Indicates if this is a premium pool requiring higher quality or voting
    },
    qualityThreshold: {
      type: Number,
      default: 0, // Minimum likes or engagement rate required for snippet inclusion in premium pools
    },
    status: {
      type: String,
      enum: ["active", "closed", "archived"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
contentPoolSchema.index({ venueId: 1, createdAt: -1 });
contentPoolSchema.index({ eventId: 1, createdAt: -1 });
contentPoolSchema.index({ creatorId: 1, createdAt: -1 });

// Method to add a snippet to the pool
contentPoolSchema.methods.addSnippet = async function (snippetId) {
  if (!this.snippets.includes(snippetId)) {
    this.snippets.push(snippetId);
    this.totalSnippets = this.snippets.length;
    await this.save();
    return true;
  }
  return false;
};

// Method to calculate earnings distribution (placeholder for actual logic)
contentPoolSchema.methods.distributeEarnings = async function (amount) {
  // Placeholder: Distribute earnings proportionally to contributors based on snippet usage
  this.totalEarnings += amount;
  await this.save();
  return this.totalEarnings;
};

// Static method to find active pools for a venue or event
contentPoolSchema.statics.findActivePools = async function (options = {}) {
  const { venueId, eventId, limit = 10 } = options;
  const query = { status: "active" };

  if (venueId) {
    query.venueId = venueId;
  }
  if (eventId) {
    query.eventId = eventId;
  }

  return this.find(query).limit(limit).sort({ createdAt: -1 });
};

const ContentPool = mongoose.model("ContentPool", contentPoolSchema);

module.exports = ContentPool;
