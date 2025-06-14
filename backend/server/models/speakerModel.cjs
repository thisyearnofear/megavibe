const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema({
  twitter: String,
  linkedin: String,
  github: String,
  website: String,
  youtube: String,
  instagram: String
}, { _id: false });

const pastEventSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  eventName: String,
  venueName: String,
  date: Date,
  role: {
    type: String,
    enum: ['speaker', 'panelist', 'moderator', 'keynote', 'workshop_leader', 'performer'],
    default: 'speaker'
  },
  topic: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  attendeeCount: Number,
  tipsReceived: {
    type: Number,
    default: 0
  },
  bountiesCompleted: {
    type: Number,
    default: 0
  }
}, { _id: false });

const speakerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Basic Profile
  displayName: {
    type: String,
    required: true
  },
  title: String,
  company: String,
  bio: {
    type: String,
    maxlength: 1000
  },
  avatar: String,
  coverImage: String,
  
  // Professional Info
  expertise: [{
    type: String,
    required: true
  }],
  specialties: [String],
  languages: [{
    language: String,
    proficiency: {
      type: String,
      enum: ['native', 'fluent', 'conversational', 'basic']
    }
  }],
  
  // Speaking Experience
  yearsExperience: Number,
  totalEvents: {
    type: Number,
    default: 0
  },
  pastEvents: [pastEventSchema],
  
  // Reputation & Social Proof
  reputation: {
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    speakingScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    reliabilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Social Proof Metrics
  socialProof: {
    followers: {
      type: Number,
      default: 0
    },
    totalTips: {
      type: Number,
      default: 0
    },
    totalBounties: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    repeatInvitations: {
      type: Number,
      default: 0
    }
  },
  
  // Contact & Social
  socialLinks: socialLinksSchema,
  contactEmail: String,
  isAvailableForBooking: {
    type: Boolean,
    default: true
  },
  
  // Speaking Preferences
  preferredTopics: [String],
  preferredFormats: [{
    type: String,
    enum: ['keynote', 'panel', 'workshop', 'fireside_chat', 'lightning_talk', 'demo', 'q_and_a']
  }],
  preferredAudienceSize: {
    min: Number,
    max: Number
  },
  travelWillingness: {
    type: String,
    enum: ['local_only', 'regional', 'national', 'international'],
    default: 'regional'
  },
  
  // Availability
  availability: {
    timezone: String,
    preferredDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    preferredTimes: [{
      start: String, // HH:MM format
      end: String    // HH:MM format
    }],
    blackoutDates: [Date],
    noticePeriod: {
      type: Number,
      default: 14 // days
    }
  },
  
  // Current Status
  currentStatus: {
    type: String,
    enum: ['available', 'busy', 'on_stage', 'in_meeting', 'traveling', 'offline'],
    default: 'available'
  },
  currentEvent: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    role: String,
    startTime: Date,
    endTime: Date
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationBadges: [{
    type: {
      type: String,
      enum: ['expert', 'frequent_speaker', 'top_rated', 'industry_leader', 'community_favorite']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  
  // Privacy Settings
  privacy: {
    showContactInfo: {
      type: Boolean,
      default: false
    },
    showPastEvents: {
      type: Boolean,
      default: true
    },
    showSocialProof: {
      type: Boolean,
      default: true
    },
    allowDirectBooking: {
      type: Boolean,
      default: true
    }
  },
  
  // Analytics
  profileViews: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
speakerSchema.index({ userId: 1 });
speakerSchema.index({ expertise: 1 });
speakerSchema.index({ 'reputation.overallScore': -1 });
speakerSchema.index({ totalEvents: -1 });
speakerSchema.index({ currentStatus: 1 });
speakerSchema.index({ isVerified: 1 });

// Virtual for speaker level based on experience and reputation
speakerSchema.virtual('level').get(function() {
  const score = this.reputation.overallScore;
  const events = this.totalEvents;
  
  if (score >= 80 && events >= 50) return 'Expert';
  if (score >= 60 && events >= 20) return 'Experienced';
  if (score >= 40 && events >= 5) return 'Intermediate';
  return 'Beginner';
});

// Method to update reputation scores
speakerSchema.methods.updateReputation = async function() {
  const pastEvents = this.pastEvents;
  
  if (pastEvents.length === 0) return;
  
  // Calculate speaking score (based on ratings)
  const ratingsSum = pastEvents.reduce((sum, event) => sum + (event.rating || 0), 0);
  const ratingsCount = pastEvents.filter(event => event.rating).length;
  this.reputation.speakingScore = ratingsCount > 0 ? (ratingsSum / ratingsCount) * 20 : 0;
  
  // Calculate engagement score (based on tips and bounties)
  const totalTips = pastEvents.reduce((sum, event) => sum + (event.tipsReceived || 0), 0);
  const totalBounties = pastEvents.reduce((sum, event) => sum + (event.bountiesCompleted || 0), 0);
  this.reputation.engagementScore = Math.min(100, (totalTips * 2) + (totalBounties * 10));
  
  // Calculate reliability score (based on completion rate and repeat invitations)
  const completedEvents = pastEvents.length;
  const repeatInvitations = this.socialProof.repeatInvitations;
  this.reputation.reliabilityScore = Math.min(100, (completedEvents * 2) + (repeatInvitations * 5));
  
  // Calculate overall score
  this.reputation.overallScore = Math.round(
    (this.reputation.speakingScore + 
     this.reputation.engagementScore + 
     this.reputation.reliabilityScore) / 3
  );
  
  // Update social proof
  this.socialProof.totalTips = totalTips;
  this.socialProof.totalBounties = totalBounties;
  this.socialProof.averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;
  this.socialProof.totalRatings = ratingsCount;
  
  return this.save();
};

// Method to add past event
speakerSchema.methods.addPastEvent = async function(eventData) {
  this.pastEvents.push(eventData);
  this.totalEvents = this.pastEvents.length;
  
  // Update reputation after adding event
  await this.updateReputation();
  
  return this.save();
};

// Method to update current status
speakerSchema.methods.updateStatus = async function(status, eventInfo = null) {
  this.currentStatus = status;
  this.lastActive = new Date();
  
  if (eventInfo) {
    this.currentEvent = eventInfo;
  } else if (status !== 'on_stage' && status !== 'in_meeting') {
    this.currentEvent = {};
  }
  
  return this.save();
};

// Static method to find speakers by expertise
speakerSchema.statics.findByExpertise = function(expertise, options = {}) {
  const query = {
    expertise: { $in: Array.isArray(expertise) ? expertise : [expertise] },
    isAvailableForBooking: true
  };
  
  if (options.minReputation) {
    query['reputation.overallScore'] = { $gte: options.minReputation };
  }
  
  if (options.minEvents) {
    query.totalEvents = { $gte: options.minEvents };
  }
  
  if (options.verified) {
    query.isVerified = true;
  }
  
  return this.find(query)
    .sort({ 'reputation.overallScore': -1, totalEvents: -1 })
    .limit(options.limit || 20);
};

// Static method to find speakers currently at venue
speakerSchema.statics.findAtVenue = function(venueId) {
  return this.find({
    'currentEvent.venueId': venueId,
    currentStatus: { $in: ['on_stage', 'available', 'in_meeting'] }
  }).populate('userId', 'username profilePictureUrl');
};

// Static method to get trending speakers
speakerSchema.statics.getTrending = function(timeframe = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        lastActive: { $gte: cutoffDate }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ['$socialProof.totalTips', 0.3] },
            { $multiply: ['$socialProof.totalBounties', 0.4] },
            { $multiply: ['$reputation.overallScore', 0.3] }
          ]
        }
      }
    },
    {
      $sort: { trendingScore: -1 }
    },
    {
      $limit: 10
    }
  ]);
};

const Speaker = mongoose.model('Speaker', speakerSchema);

module.exports = Speaker;