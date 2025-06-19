const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bountySchema = new Schema({
  // On-chain reference
  contractBountyId: {
    type: Number,
    required: true,
    unique: true
  },
  
  // Core bounty data
  sponsor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  
  speaker: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Bounty details
  description: {
    type: String,
    required: true,
    maxLength: 500
  },
  
  rewardAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  deadline: {
    type: Date,
    required: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'claimed', 'expired', 'cancelled'],
    default: 'active'
  },
  
  // Claim information
  claimant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  submissionHash: {
    type: String,
    default: null
  },
  
  claimedAt: {
    type: Date,
    default: null
  },
  
  // Transaction data
  txHash: {
    type: String,
    required: true
  },
  
  blockNumber: {
    type: Number,
    default: null
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  
  contentType: {
    type: String,
    enum: ['video', 'audio', 'image', 'text', 'mixed'],
    default: 'video'
  },
  
  requirements: {
    duration: {
      min: Number,
      max: Number
    },
    format: [String],
    quality: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bountySchema.index({ event: 1, status: 1 });
bountySchema.index({ speaker: 1, status: 1 });
bountySchema.index({ sponsor: 1 });
bountySchema.index({ deadline: 1, status: 1 });
bountySchema.index({ contractBountyId: 1 });

// Virtual for time remaining
bountySchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const remaining = this.deadline.getTime() - now.getTime();
  return Math.max(0, remaining);
});

// Virtual for is expired
bountySchema.virtual('isExpired').get(function() {
  return new Date() > this.deadline;
});

// Static methods
bountySchema.statics.getActiveBountiesForEvent = function(eventId) {
  return this.find({
    event: eventId,
    status: 'active',
    deadline: { $gt: new Date() }
  })
  .populate('sponsor', 'username avatar')
  .populate('speaker', 'username avatar')
  .sort({ createdAt: -1 });
};

bountySchema.statics.getEventStats = function(eventId) {
  return this.aggregate([
    { $match: { event: mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: null,
        totalBounties: { $sum: 1 },
        totalReward: { $sum: '$rewardAmount' },
        activeBounties: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'active'] },
                { $gt: ['$deadline', new Date()] }
              ]},
              1,
              0
            ]
          }
        },
        claimedBounties: {
          $sum: {
            $cond: [{ $eq: ['$status', 'claimed'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

bountySchema.statics.getSpeakerEarnings = function(speakerId, timeframe = '24h') {
  const timeMap = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const since = new Date(Date.now() - timeMap[timeframe]);
  
  return this.aggregate([
    {
      $match: {
        speaker: mongoose.Types.ObjectId(speakerId),
        status: 'claimed',
        claimedAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$rewardAmount' },
        bountyCount: { $sum: 1 },
        avgBounty: { $avg: '$rewardAmount' }
      }
    }
  ]);
};

// Instance methods
bountySchema.methods.canBeClaimed = function() {
  return this.status === 'active' && 
         new Date() <= this.deadline;
};

bountySchema.methods.markAsClaimed = function(claimantId, submissionHash) {
  this.status = 'claimed';
  this.claimant = claimantId;
  this.submissionHash = submissionHash;
  this.claimedAt = new Date();
  return this.save();
};

bountySchema.methods.markAsExpired = function() {
  if (this.isExpired && this.status === 'active') {
    this.status = 'expired';
    return this.save();
  }
  return Promise.resolve(this);
};

// Pre-save middleware
bountySchema.pre('save', function(next) {
  // Auto-expire if past deadline
  if (this.isExpired && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Export model
module.exports = mongoose.model('Bounty', bountySchema);
