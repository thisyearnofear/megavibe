const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 100,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
    },
    audioFile: {
      url: String, // IPFS or cloud storage URL
      ipfsHash: String,
      duration: Number, // in seconds
      format: String,
      size: Number, // in bytes
      waveform: [Number], // Normalized amplitude data for visualization
    },
    transcript: String, // Auto-generated or manual
    type: {
      type: String,
      enum: [
        "performance",
        "reaction",
        "interview",
        "ambient",
        "announcement",
        "other",
      ],
      default: "performance",
    },
    mood: {
      type: String,
      enum: [
        "energetic",
        "chill",
        "emotional",
        "funny",
        "intense",
        "inspiring",
      ],
    },
    tags: [String],
    privacy: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number], // [longitude, latitude]
    },
    stats: {
      plays: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
    },
    interactions: {
      likedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      sharedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      savedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    monetization: {
      isMonetized: { type: Boolean, default: false },
      price: Number,
      currency: { type: String, default: "USD" },
      earnings: { type: Number, default: 0 },
      purchases: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Purchase",
        },
      ],
      isInPool: { type: Boolean, default: false }, // Indicates if snippet is part of a content pool
      poolId: { type: mongoose.Schema.Types.ObjectId, ref: "ContentPool" }, // Reference to content pool
      poolContributionFee: { type: Number, default: 0 }, // Fee paid to contribute to pool
      usageCount: { type: Number, default: 0 }, // Tracks how often snippet is used/shared for payouts
      payoutPerUse: { type: Number, default: 0 }, // Amount paid to creator per use
      isViral: { type: Boolean, default: false }, // Indicates if snippet has met viral criteria
      isNFT: { type: Boolean, default: false }, // Indicates if snippet has been minted as an NFT
      nftTokenId: { type: String }, // Blockchain token ID for the NFT
      nftContractAddress: { type: String }, // Contract address where NFT was minted
      nftOwner: { type: String }, // Current owner address of the NFT
    },
    playlists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist",
      },
    ],
    quality: {
      bitrate: Number,
      sampleRate: Number,
      isEnhanced: { type: Boolean, default: false },
    },
    aiAnalysis: {
      hasMusic: Boolean,
      hasSpeech: Boolean,
      dominantInstruments: [String],
      speechLanguage: String,
      emotionalTone: String,
      audioQualityScore: Number, // 0-100
    },
    reportStatus: {
      isReported: { type: Boolean, default: false },
      reports: [
        {
          reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          reason: String,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      reviewStatus: {
        type: String,
        enum: ["pending", "approved", "removed"],
        default: "approved",
      },
    },
    votes: {
      votesFor: { type: Number, default: 0 }, // Votes in favor of snippet quality
      votesAgainst: { type: Number, default: 0 }, // Votes against snippet quality
      votedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ], // Users who have voted to prevent multiple votes
    },
    isVerified: {
      type: Boolean,
      default: false,
    }, // Verified as authentic recording from the event
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
snippetSchema.index({ "stats.plays": -1 });
snippetSchema.index({ "stats.likes": -1 });
snippetSchema.index({ recordedAt: -1 });
snippetSchema.index({ creator: 1, recordedAt: -1 });
snippetSchema.index({ venue: 1, recordedAt: -1 });
snippetSchema.index({ title: "text", tags: "text" });

// Geospatial index
snippetSchema.index({ location: "2dsphere" });

// Virtual for engagement rate
snippetSchema.virtual("engagementRate").get(function () {
  if (this.stats.plays === 0) return 0;

  const totalEngagements =
    this.stats.likes +
    this.stats.shares +
    this.stats.comments +
    this.stats.saves;

  return (totalEngagements / this.stats.plays) * 100;
});

// Method to increment play count
snippetSchema.methods.incrementPlays = async function () {
  this.stats.plays += 1;
  return this.save();
};

// Method to toggle like
snippetSchema.methods.toggleLike = async function (userId) {
  const userIdStr = userId.toString();
  const likeIndex = this.interactions.likedBy.findIndex(
    (id) => id.toString() === userIdStr
  );

  if (likeIndex > -1) {
    // Unlike
    this.interactions.likedBy.splice(likeIndex, 1);
    this.stats.likes = Math.max(0, this.stats.likes - 1);
  } else {
    // Like
    this.interactions.likedBy.push(userId);
    this.stats.likes += 1;
  }

  return this.save();
};

// Method to check if user can access
snippetSchema.methods.canAccess = function (userId) {
  if (this.privacy === "public") return true;
  if (!userId) return false;

  if (this.creator.toString() === userId.toString()) return true;

  if (this.privacy === "private") return false;

  // For 'followers' privacy, would need to check if user follows creator
  // This would require additional logic based on your follow system
  return true; // Placeholder
};

// Static method to get feed
snippetSchema.statics.getFeed = async function (options = {}) {
  const {
    userId,
    filter = "all", // 'all', 'following', 'popular', 'nearby'
    venueId,
    artistId,
    limit = 20,
    offset = 0,
    coordinates,
  } = options;

  const query = {
    privacy: "public",
    "reportStatus.reviewStatus": "approved",
  };

  if (venueId) {
    query.venue = venueId;
  }

  if (artistId) {
    query.artist = artistId;
  }

  let sortCriteria = { recordedAt: -1 }; // Default: most recent

  if (filter === "popular") {
    sortCriteria = { "stats.likes": -1 };
  }

  let aggregatePipeline = [];

  if (filter === "nearby" && coordinates) {
    aggregatePipeline.push({
      $geoNear: {
        near: {
          type: "Point",
          coordinates: coordinates,
        },
        distanceField: "distance",
        maxDistance: 10000, // 10km
        spherical: true,
        query: query,
      },
    });
  } else {
    aggregatePipeline.push({ $match: query });
  }

  aggregatePipeline.push(
    { $sort: sortCriteria },
    { $skip: offset },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creator",
      },
    },
    { $unwind: "$creator" },
    {
      $lookup: {
        from: "venues",
        localField: "venue",
        foreignField: "_id",
        as: "venue",
      },
    },
    {
      $unwind: {
        path: "$venue",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        title: 1,
        audioFile: 1,
        duration: "$audioFile.duration",
        stats: 1,
        tags: 1,
        recordedAt: 1,
        "creator._id": 1,
        "creator.username": 1,
        "creator.profilePictureUrl": 1,
        "venue._id": 1,
        "venue.name": 1,
        hasLiked: {
          $in: [
            userId ? mongoose.Types.ObjectId(userId) : null,
            "$interactions.likedBy",
          ],
        },
      },
    }
  );

  return this.aggregate(aggregatePipeline);
};

const AudioSnippet = mongoose.model("AudioSnippet", snippetSchema);

module.exports = AudioSnippet;
