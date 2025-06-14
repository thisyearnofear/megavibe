const mongoose = require('mongoose');

// User Reputation Schema
const userReputationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true
  },
  
  // Overall Reputation Score
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1000
  },
  
  // Reputation Categories
  categories: {
    curator: {
      score: { type: Number, default: 0, min: 0, max: 100 },
      level: { type: String, enum: ['Novice', 'Apprentice', 'Expert', 'Master', 'Legend'], default: 'Novice' },
      badges: [{ type: String }] // e.g., 'Viral Predictor', 'Quality Curator'
    },
    supporter: {
      score: { type: Number, default: 0, min: 0, max: 100 },
      level: { type: String, enum: ['Novice', 'Apprentice', 'Expert', 'Master', 'Legend'], default: 'Novice' },
      badges: [{ type: String }] // e.g., 'Generous Tipper', 'Artist Champion'
    },
    attendee: {
      score: { type: Number, default: 0, min: 0, max: 100 },
      level: { type: String, enum: ['Novice', 'Apprentice', 'Expert', 'Master', 'Legend'], default: 'Novice' },
      badges: [{ type: String }] // e.g., 'Event Explorer', 'Conference Regular'
    },
    influencer: {
      score: { type: Number, default: 0, min: 0, max: 100 },
      level: { type: String, enum: ['Novice', 'Apprentice', 'Expert', 'Master', 'Legend'], default: 'Novice' },
      badges: [{ type: String }] // e.g., 'Trend Setter', 'Community Builder'
    }
  },
  
  // Proof of Presence NFTs
  presenceNFTs: [{
    tokenId: String,
    contractAddress: String,
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    eventName: String,
    venueName: String,
    attendanceDate: Date,
    verificationMethod: { type: String, enum: ['GPS', 'QR', 'NFC', 'Manual'], default: 'GPS' },
    metadata: {
      duration: Number, // minutes attended
      interactions: Number, // tips, reactions, etc.
      socialShares: Number
    }
  }],
  
  // Expertise Areas (based on event types and engagement)
  expertise: [{
    category: String, // e.g., 'DeFi', 'NFTs', 'Web3', 'Music', 'Comedy'
    score: { type: Number, default: 0, min: 0, max: 100 },
    eventsAttended: Number,
    totalEngagement: Number, // tips + reactions + shares
    lastActivity: Date
  }],
  
  // Taste Verification (prediction accuracy)
  tasteMetrics: {
    contentPredictions: {
      total: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 } // percentage
    },
    viralPredictions: {
      total: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    },
    trendSpotting: {
      earlyAdopterScore: { type: Number, default: 0 }, // how early they engage with trending content
      influenceScore: { type: Number, default: 0 } // how much their engagement predicts trends
    }
  },
  
  // Cross-Event Reputation
  crossEventMetrics: {
    uniqueVenues: { type: Number, default: 0 },
    uniqueEvents: { type: Number, default: 0 },
    totalAttendance: { type: Number, default: 0 },
    averageEngagement: { type: Number, default: 0 },
    networkConnections: { type: Number, default: 0 } // connections made across events
  },
  
  // Reputation History
  history: [{
    date: { type: Date, default: Date.now },
    action: String, // e.g., 'tip_sent', 'content_shared', 'event_attended'
    points: Number,
    category: String,
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Achievements and Milestones
  achievements: [{
    id: String,
    name: String,
    description: String,
    category: String,
    unlockedAt: { type: Date, default: Date.now },
    rarity: { type: String, enum: ['Common', 'Rare', 'Epic', 'Legendary'], default: 'Common' },
    nftTokenId: String // if achievement is minted as NFT
  }],
  
  // Reputation Marketplace Access
  marketplaceAccess: {
    tier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'], default: 'Bronze' },
    exclusiveEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    earlyAccess: { type: Boolean, default: false },
    specialPerks: [{ type: String }] // e.g., 'VIP Seating', 'Backstage Access'
  },
  
  // Social Proof
  socialProof: {
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    endorsements: [{ 
      fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      category: String,
      message: String,
      date: { type: Date, default: Date.now }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reputation level calculation
userReputationSchema.virtual('reputationLevel').get(function() {
  const score = this.overallScore;
  if (score >= 900) return 'Legend';
  if (score >= 750) return 'Master';
  if (score >= 500) return 'Expert';
  if (score >= 250) return 'Apprentice';
  return 'Novice';
});

// Virtual for reputation percentile
userReputationSchema.virtual('percentile').get(function() {
  // This would be calculated based on all users in the system
  // For now, return a placeholder
  return Math.min(Math.floor(this.overallScore / 10), 100);
});

// Methods
userReputationSchema.methods.addReputationPoints = function(points, category, action, eventDetails = {}) {
  // Add points to overall score
  this.overallScore = Math.min(this.overallScore + points, 1000);
  
  // Add points to specific category
  if (this.categories[category]) {
    this.categories[category].score = Math.min(this.categories[category].score + points, 100);
    this.categories[category].level = this.calculateCategoryLevel(this.categories[category].score);
  }
  
  // Add to history
  this.history.push({
    action,
    points,
    category,
    eventId: eventDetails.eventId,
    venueId: eventDetails.venueId,
    details: eventDetails
  });
  
  // Check for new achievements
  this.checkAchievements();
  
  return this.save();
};

userReputationSchema.methods.calculateCategoryLevel = function(score) {
  if (score >= 90) return 'Legend';
  if (score >= 75) return 'Master';
  if (score >= 50) return 'Expert';
  if (score >= 25) return 'Apprentice';
  return 'Novice';
};

userReputationSchema.methods.checkAchievements = function() {
  const achievements = [];
  
  // Check for milestone achievements
  if (this.overallScore >= 100 && !this.achievements.find(a => a.id === 'first_100')) {
    achievements.push({
      id: 'first_100',
      name: 'Rising Star',
      description: 'Reached 100 reputation points',
      category: 'milestone',
      rarity: 'Common'
    });
  }
  
  if (this.crossEventMetrics.uniqueVenues >= 10 && !this.achievements.find(a => a.id === 'venue_explorer')) {
    achievements.push({
      id: 'venue_explorer',
      name: 'Venue Explorer',
      description: 'Visited 10 different venues',
      category: 'exploration',
      rarity: 'Rare'
    });
  }
  
  if (this.tasteMetrics.contentPredictions.accuracy >= 80 && !this.achievements.find(a => a.id === 'taste_maker')) {
    achievements.push({
      id: 'taste_maker',
      name: 'Taste Maker',
      description: '80%+ accuracy in content predictions',
      category: 'curation',
      rarity: 'Epic'
    });
  }
  
  // Add new achievements
  achievements.forEach(achievement => {
    this.achievements.push(achievement);
  });
  
  return achievements;
};

userReputationSchema.methods.addPresenceNFT = function(nftData) {
  this.presenceNFTs.push(nftData);
  
  // Update cross-event metrics
  this.crossEventMetrics.totalAttendance += 1;
  
  // Update unique venues/events
  const uniqueVenues = new Set(this.presenceNFTs.map(nft => nft.venueId.toString()));
  const uniqueEvents = new Set(this.presenceNFTs.map(nft => nft.eventId.toString()));
  
  this.crossEventMetrics.uniqueVenues = uniqueVenues.size;
  this.crossEventMetrics.uniqueEvents = uniqueEvents.size;
  
  // Add reputation points for attendance
  return this.addReputationPoints(10, 'attendee', 'event_attended', {
    eventId: nftData.eventId,
    venueId: nftData.venueId,
    duration: nftData.metadata.duration
  });
};

userReputationSchema.methods.updateExpertise = function(category, engagementPoints) {
  let expertise = this.expertise.find(e => e.category === category);
  
  if (!expertise) {
    expertise = {
      category,
      score: 0,
      eventsAttended: 0,
      totalEngagement: 0,
      lastActivity: new Date()
    };
    this.expertise.push(expertise);
  }
  
  expertise.totalEngagement += engagementPoints;
  expertise.score = Math.min(expertise.score + Math.floor(engagementPoints / 10), 100);
  expertise.lastActivity = new Date();
  
  return this.save();
};

// Indexes for performance
userReputationSchema.index({ userId: 1 });
userReputationSchema.index({ walletAddress: 1 });
userReputationSchema.index({ overallScore: -1 });
userReputationSchema.index({ 'categories.curator.score': -1 });
userReputationSchema.index({ 'categories.supporter.score': -1 });
userReputationSchema.index({ 'crossEventMetrics.uniqueVenues': -1 });

module.exports = mongoose.model('UserReputation', userReputationSchema);