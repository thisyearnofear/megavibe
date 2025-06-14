const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  
  // Event and Venue References
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
    index: true
  },
  
  // Performer Information
  performerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performerName: String,
  performerType: {
    type: String,
    enum: ['speaker', 'musician', 'comedian', 'presenter', 'panelist', 'moderator'],
    default: 'speaker'
  },
  
  // Performance Details
  description: String,
  topic: String,
  category: {
    type: String,
    enum: ['keynote', 'panel', 'workshop', 'performance', 'demo', 'q_and_a', 'networking'],
    default: 'keynote'
  },
  
  // Timing
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: function() {
      if (this.startTime && this.endTime) {
        return Math.round((this.endTime - this.startTime) / (1000 * 60));
      }
      return 0;
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  
  // Live Influence Data
  totalTips: {
    type: Number,
    default: 0
  },
  
  // Performance choices influenced by tips
  influenceChoices: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Topic requests with tip amounts
  topicRequests: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Audience Reactions
  reactions: {
    positive: {
      type: Number,
      default: 0
    },
    neutral: {
      type: Number,
      default: 0
    },
    negative: {
      type: Number,
      default: 0
    },
    love: {
      type: Number,
      default: 0
    },
    fire: {
      type: Number,
      default: 0
    },
    clap: {
      type: Number,
      default: 0
    },
    wow: {
      type: Number,
      default: 0
    }
  },
  
  // Social Sharing
  socialShares: {
    type: Number,
    default: 0
  },
  sharePlatforms: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Content and Media
  snippets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioSnippet'
  }],
  
  // Engagement Metrics
  engagement: {
    totalInteractions: {
      type: Number,
      default: 0
    },
    uniqueParticipants: {
      type: Number,
      default: 0
    },
    averageEngagementTime: {
      type: Number,
      default: 0 // in seconds
    },
    peakConcurrentViewers: {
      type: Number,
      default: 0
    }
  },
  
  // Performance Quality Metrics
  qualityMetrics: {
    audioQuality: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    contentRelevance: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    audienceEngagement: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },
  
  // Bounties related to this performance
  bounties: [{
    bountyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bounty'
    },
    status: {
      type: String,
      enum: ['active', 'fulfilled', 'expired'],
      default: 'active'
    },
    amount: Number,
    description: String
  }],
  
  // Performance Tags
  tags: [String],
  
  // Technical Details
  streamingInfo: {
    isLive: {
      type: Boolean,
      default: false
    },
    streamUrl: String,
    recordingUrl: String,
    platform: String
  },
  
  // Analytics Data
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    uniqueViewers: {
      type: Number,
      default: 0
    },
    averageViewDuration: {
      type: Number,
      default: 0 // in seconds
    },
    dropOffPoints: [{
      timestamp: Number, // seconds from start
      viewerCount: Number
    }],
    engagementPeaks: [{
      timestamp: Number, // seconds from start
      engagementScore: Number,
      triggerEvent: String // 'tip', 'reaction', 'share', etc.
    }]
  },
  
  // Feedback and Reviews
  feedback: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Moderation
  moderationFlags: [{
    type: {
      type: String,
      enum: ['inappropriate_content', 'spam', 'harassment', 'copyright', 'other']
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  metadata: {
    language: {
      type: String,
      default: 'en'
    },
    accessibility: {
      hasTranscription: {
        type: Boolean,
        default: false
      },
      hasSignLanguage: {
        type: Boolean,
        default: false
      },
      hasClosedCaptions: {
        type: Boolean,
        default: false
      }
    },
    technicalSpecs: {
      audioFormat: String,
      videoFormat: String,
      bitrate: Number,
      resolution: String
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
performanceSchema.index({ eventId: 1, startTime: 1 });
performanceSchema.index({ venueId: 1, status: 1 });
performanceSchema.index({ performerId: 1, startTime: -1 });
performanceSchema.index({ status: 1, startTime: 1 });
performanceSchema.index({ totalTips: -1 });
performanceSchema.index({ 'reactions.positive': -1 });
performanceSchema.index({ socialShares: -1 });

// Virtual for total reactions
performanceSchema.virtual('totalReactions').get(function() {
  return (this.reactions.positive || 0) + 
         (this.reactions.neutral || 0) + 
         (this.reactions.negative || 0) +
         (this.reactions.love || 0) +
         (this.reactions.fire || 0) +
         (this.reactions.clap || 0) +
         (this.reactions.wow || 0);
});

// Virtual for sentiment score
performanceSchema.virtual('sentimentScore').get(function() {
  const total = this.totalReactions;
  if (total === 0) return 0;
  
  const positiveWeight = (this.reactions.positive || 0) + 
                        (this.reactions.love || 0) + 
                        (this.reactions.fire || 0) + 
                        (this.reactions.clap || 0) + 
                        (this.reactions.wow || 0);
  const negativeWeight = this.reactions.negative || 0;
  const neutralWeight = this.reactions.neutral || 0;
  
  return ((positiveWeight * 1) + (neutralWeight * 0) + (negativeWeight * -1)) / total;
});

// Virtual for engagement score
performanceSchema.virtual('engagementScore').get(function() {
  const tipWeight = (this.totalTips || 0) * 0.3;
  const reactionWeight = this.totalReactions * 0.2;
  const shareWeight = (this.socialShares || 0) * 0.5;
  
  return Math.round(tipWeight + reactionWeight + shareWeight);
});

// Virtual to check if performance is currently live
performanceSchema.virtual('isLive').get(function() {
  const now = new Date();
  return this.status === 'live' || 
         (this.status === 'scheduled' && 
          now >= this.startTime && 
          now <= this.endTime);
});

// Method to update performance status based on time
performanceSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (now < this.startTime) {
    this.status = 'scheduled';
  } else if (now >= this.startTime && now <= this.endTime) {
    this.status = 'live';
    this.streamingInfo.isLive = true;
  } else if (now > this.endTime) {
    this.status = 'completed';
    this.streamingInfo.isLive = false;
  }
  
  return this.save();
};

// Method to add reaction
performanceSchema.methods.addReaction = function(reactionType, count = 1) {
  if (this.reactions[reactionType] !== undefined) {
    this.reactions[reactionType] += count;
    this.engagement.totalInteractions += count;
    return this.save();
  }
  throw new Error(`Invalid reaction type: ${reactionType}`);
};

// Method to add tip influence
performanceSchema.methods.addTipInfluence = function(choice, amount) {
  this.totalTips += amount;
  
  if (choice) {
    const currentAmount = this.influenceChoices.get(choice) || 0;
    this.influenceChoices.set(choice, currentAmount + amount);
  }
  
  this.engagement.totalInteractions += 1;
  return this.save();
};

// Method to add topic request
performanceSchema.methods.addTopicRequest = function(topic, amount) {
  const currentAmount = this.topicRequests.get(topic) || 0;
  this.topicRequests.set(topic, currentAmount + amount);
  
  this.engagement.totalInteractions += 1;
  return this.save();
};

// Method to record social share
performanceSchema.methods.recordShare = function(platform) {
  this.socialShares += 1;
  
  if (platform) {
    const currentCount = this.sharePlatforms.get(platform) || 0;
    this.sharePlatforms.set(platform, currentCount + 1);
  }
  
  this.engagement.totalInteractions += 1;
  return this.save();
};

// Method to calculate overall performance score
performanceSchema.methods.calculatePerformanceScore = function() {
  const tipScore = Math.min((this.totalTips || 0) / 100, 10); // Max 10 points for tips
  const reactionScore = Math.min(this.totalReactions / 50, 10); // Max 10 points for reactions
  const shareScore = Math.min((this.socialShares || 0) / 10, 10); // Max 10 points for shares
  const sentimentScore = Math.max(this.sentimentScore * 5, 0); // Max 5 points for sentiment
  
  return Math.round(tipScore + reactionScore + shareScore + sentimentScore);
};

// Static method to find live performances
performanceSchema.statics.findLive = function(venueId = null) {
  const query = { status: 'live' };
  if (venueId) query.venueId = venueId;
  
  return this.find(query)
    .populate('performerId', 'username profilePictureUrl')
    .populate('eventId', 'name type')
    .populate('venueId', 'name address')
    .sort({ startTime: 1 });
};

// Static method to find trending performances
performanceSchema.statics.findTrending = function(timeframe = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: cutoffDate },
        status: { $in: ['live', 'completed'] }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ['$totalTips', 0.4] },
            { $multiply: ['$socialShares', 0.3] },
            { $multiply: [
              { $add: [
                '$reactions.positive',
                '$reactions.love',
                '$reactions.fire',
                '$reactions.clap',
                '$reactions.wow'
              ]}, 0.3
            ]}
          ]
        }
      }
    },
    {
      $sort: { trendingScore: -1 }
    },
    {
      $limit: 20
    }
  ]);
};

// Static method to get performance analytics for venue
performanceSchema.statics.getVenueAnalytics = function(venueId, timeframe = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        venueId: mongoose.Types.ObjectId(venueId),
        startTime: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: null,
        totalPerformances: { $sum: 1 },
        totalTips: { $sum: '$totalTips' },
        totalShares: { $sum: '$socialShares' },
        totalReactions: { 
          $sum: { 
            $add: [
              '$reactions.positive',
              '$reactions.neutral', 
              '$reactions.negative',
              '$reactions.love',
              '$reactions.fire',
              '$reactions.clap',
              '$reactions.wow'
            ]
          }
        },
        averageRating: { $avg: '$qualityMetrics.overallRating' },
        topPerformances: {
          $push: {
            id: '$_id',
            title: '$title',
            totalTips: '$totalTips',
            totalReactions: { 
              $add: [
                '$reactions.positive',
                '$reactions.neutral', 
                '$reactions.negative',
                '$reactions.love',
                '$reactions.fire',
                '$reactions.clap',
                '$reactions.wow'
              ]
            }
          }
        }
      }
    }
  ]);
};

const Performance = mongoose.model('Performance', performanceSchema);

module.exports = Performance;