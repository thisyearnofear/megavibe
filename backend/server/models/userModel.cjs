// models/user.js - Enhanced for MetaMask SDK Authentication
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Basic user information
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Optional for wallet users

    // Wallet-based authentication
    walletAddress: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
      lowercase: true,
    },
    authMethod: {
      type: String,
      enum: ["metamask", "dynamic", "social", "traditional"],
      default: "traditional",
    },

    // Profile information
    profile: {
      name: { type: String },
      avatar: { type: String },
      bio: { type: String },
      isWalletUser: { type: Boolean, default: false },
      createdVia: { type: String }, // Track how user was created
    },

    // Reputation system for hackathon
    reputation: {
      score: { type: Number, default: 0 },
      level: { type: String, default: "Newcomer" },
      badges: [{ type: String }],
      lastUpdated: { type: Date, default: Date.now },
    },

    // Legacy fields (keeping for backward compatibility)
    dateOfBirth: { type: Date },
    country: { type: String },
    favoriteGenres: [{ type: String }],
    profilePictureUrl: { type: String },
    following: [{ type: String }], // Store user IDs of followed artists
    interactions: [
      {
        songId: { type: String },
        rating: { type: Number },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Activity tracking
    lastLogin: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for wallet address lookups
userSchema.index({ walletAddress: 1 });
userSchema.index({ authMethod: 1 });
userSchema.index({ "reputation.score": -1 });

// Hash password before saving (only if password is provided)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.checkPassword = async function (candidatePassword) {
  if (!this.password) {
    return false; // Wallet users don't have passwords
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update reputation
userSchema.methods.updateReputation = function (points, reason) {
  this.reputation.score += points;
  this.reputation.lastUpdated = new Date();

  // Update level based on score
  if (this.reputation.score >= 1000) {
    this.reputation.level = "Legend";
  } else if (this.reputation.score >= 500) {
    this.reputation.level = "Expert";
  } else if (this.reputation.score >= 100) {
    this.reputation.level = "Regular";
  } else if (this.reputation.score >= 10) {
    this.reputation.level = "Active";
  } else {
    this.reputation.level = "Newcomer";
  }

  return this.save();
};

// Static method to find user by wallet address
userSchema.statics.findByWallet = function (walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

// Static method to create wallet user
userSchema.statics.createWalletUser = function (
  walletAddress,
  authMethod = "metamask"
) {
  const username = `user_${walletAddress.slice(2, 8)}`;
  const email = `${walletAddress.toLowerCase()}@wallet.megavibe.app`;

  return this.create({
    username,
    email,
    walletAddress: walletAddress.toLowerCase(),
    authMethod,
    profile: {
      isWalletUser: true,
      createdVia: authMethod,
    },
    reputation: {
      score: 0,
      level: "Newcomer",
      badges: [],
    },
  });
};

const User = mongoose.model("User", userSchema);

module.exports = User;
