const mongoose = require('mongoose');

// Live Attendee Schema for real-time venue presence
const liveAttendeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false
  },
  
  // Location and Presence Data
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    },
    accuracy: {
      type: Number,
      default: 10 // meters
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Verification Method
  verificationMethod: {
    type: String,
    enum: ['GPS', 'QR', 'NFC', 'Bluetooth', 'Manual'],
    default: 'GPS'
  },
  
  // Session Information
  sessionInfo: {
    checkedInAt: {
      type: Date,
      default: Date.now
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sessionDuration: {
      type: Number,
      default: 0 // minutes
    }
  },
  
  // User Profile for Discovery
  discoveryProfile: {
    displayName: String,
    avatar: String,
    isVisible: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['Available', 'Busy', 'Do Not Disturb', 'Networking'],
      default: 'Available'
    },
    bio: String,
    interests: [String],
    expertise: [String],
    lookingFor: [String] // e.g., 'Networking', 'Learning', 'Collaboration'
  },
  
  // Reputation Context
  reputationContext: {
    overallScore: {
      type: Number,
      default: 0
    },
    level: {
      type: String,
      default: 'Novice'
    },
    badges: [String],
    expertise: [{
      category: String,
      score: Number
    }]
  },
  
  // Current Activity
  currentActivity: {
    type: String,
    enum: ['Listening', 'Networking', 'Speaking', 'Performing', 'Organizing', 'Exploring'],
    default: 'Listening'
  },
  
  // Social Connections at Event
  connections: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    connectedAt: {
      type: Date,
      default: Date.now
    },
    connectionType: {
      type: String,
      enum: ['Met', 'Exchanged Contacts', 'Collaborated', 'Followed'],
      default: 'Met'
    },
    notes: String
  }],
  
  // Privacy Settings
  privacy: {
    shareLocation: {
      type: Boolean,
      default: true
    },
    shareActivity: {
      type: Boolean,
      default: true
    },
    shareReputation: {
      type: Boolean,
      default: true
    },
    allowConnections: {
      type: Boolean,
      default: true
    },
    visibilityRadius: {
      type: Number,
      default: 100 // meters
    }
  },
  
  // Engagement Metrics
  engagement: {
    tipsGiven: {
      type: Number,
      default: 0
    },
    reactionsGiven: {
      type: Number,
      default: 0
    },
    contentShared: {
      type: Number,
      default: 0
    },
    connectionsMode: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
liveAttendeeSchema.index({ venueId: 1, 'sessionInfo.isActive': 1 });
liveAttendeeSchema.index({ eventId: 1, 'sessionInfo.isActive': 1 });
liveAttendeeSchema.index({ 'location.coordinates': '2dsphere' });
liveAttendeeSchema.index({ userId: 1, venueId: 1 }, { unique: true });
liveAttendeeSchema.index({ 'sessionInfo.lastSeenAt': 1 });

// Virtual for session duration calculation
liveAttendeeSchema.virtual('currentSessionDuration').get(function() {
  if (!this.sessionInfo.isActive) return this.sessionInfo.sessionDuration;
  
  const now = new Date();
  const checkedIn = this.sessionInfo.checkedInAt;
  return Math.floor((now - checkedIn) / (1000 * 60)); // minutes
});

// Virtual for distance calculation (set by queries)
liveAttendeeSchema.virtual('distance');

// Methods
liveAttendeeSchema.methods.updateLocation = function(coordinates, accuracy = 10) {
  this.location.coordinates = coordinates;
  this.location.accuracy = accuracy;
  this.location.lastUpdated = new Date();
  this.sessionInfo.lastSeenAt = new Date();
  
  return this.save();
};

liveAttendeeSchema.methods.updateActivity = function(activity) {
  this.currentActivity = activity;
  this.sessionInfo.lastSeenAt = new Date();
  
  return this.save();
};

liveAttendeeSchema.methods.addConnection = function(userId, connectionType = 'Met', notes = '') {
  // Check if connection already exists
  const existingConnection = this.connections.find(
    conn => conn.userId.toString() === userId.toString()
  );
  
  if (existingConnection) {
    existingConnection.connectionType = connectionType;
    existingConnection.notes = notes;
    existingConnection.connectedAt = new Date();
  } else {
    this.connections.push({
      userId,
      connectionType,
      notes,
      connectedAt: new Date()
    });
  }
  
  this.engagement.connectionsMode += 1;
  return this.save();
};

liveAttendeeSchema.methods.checkOut = function() {
  this.sessionInfo.isActive = false;
  this.sessionInfo.sessionDuration = this.currentSessionDuration;
  
  return this.save();
};

liveAttendeeSchema.methods.updateEngagement = function(type, amount = 1) {
  if (this.engagement[type] !== undefined) {
    this.engagement[type] += amount;
    this.sessionInfo.lastSeenAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
liveAttendeeSchema.statics.findNearbyAttendees = function(coordinates, maxDistance = 100, venueId = null) {
  const query = {
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    'sessionInfo.isActive': true,
    'privacy.shareLocation': true
  };
  
  if (venueId) {
    query.venueId = venueId;
  }
  
  return this.find(query)
    .populate('userId', 'username email avatar')
    .populate('venueId', 'name address')
    .populate('eventId', 'name startTime endTime');
};

liveAttendeeSchema.statics.findAttendeesAtVenue = function(venueId, options = {}) {
  const query = {
    venueId,
    'sessionInfo.isActive': true,
    'discoveryProfile.isVisible': true
  };
  
  // Apply filters
  if (options.activity) {
    query.currentActivity = options.activity;
  }
  
  if (options.expertise) {
    query['discoveryProfile.expertise'] = { $in: [options.expertise] };
  }
  
  if (options.status) {
    query['discoveryProfile.status'] = options.status;
  }
  
  if (options.minReputation) {
    query['reputationContext.overallScore'] = { $gte: options.minReputation };
  }
  
  return this.find(query)
    .populate('userId', 'username email avatar')
    .sort({ 'reputationContext.overallScore': -1, 'sessionInfo.checkedInAt': 1 });
};

liveAttendeeSchema.statics.getVenueStats = function(venueId) {
  return this.aggregate([
    {
      $match: {
        venueId: mongoose.Types.ObjectId(venueId),
        'sessionInfo.isActive': true
      }
    },
    {
      $group: {
        _id: null,
        totalAttendees: { $sum: 1 },
        averageReputation: { $avg: '$reputationContext.overallScore' },
        activities: { $push: '$currentActivity' },
        expertise: { $push: '$discoveryProfile.expertise' }
      }
    },
    {
      $project: {
        totalAttendees: 1,
        averageReputation: { $round: ['$averageReputation', 1] },
        topActivities: {
          $slice: [
            {
              $map: {
                input: { $setUnion: ['$activities'] },
                as: 'activity',
                in: {
                  activity: '$$activity',
                  count: {
                    $size: {
                      $filter: {
                        input: '$activities',
                        cond: { $eq: ['$$this', '$$activity'] }
                      }
                    }
                  }
                }
              }
            },
            5
          ]
        },
        topExpertise: {
          $slice: [
            {
              $map: {
                input: { $setUnion: [{ $reduce: { input: '$expertise', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } }] },
                as: 'expert',
                in: {
                  expertise: '$$expert',
                  count: {
                    $size: {
                      $filter: {
                        input: { $reduce: { input: '$expertise', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
                        cond: { $eq: ['$$this', '$$expert'] }
                      }
                    }
                  }
                }
              }
            },
            5
          ]
        }
      }
    }
  ]);
};

// Auto-cleanup inactive sessions (older than 30 minutes)
liveAttendeeSchema.statics.cleanupInactiveSessions = function() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  return this.updateMany(
    {
      'sessionInfo.lastSeenAt': { $lt: thirtyMinutesAgo },
      'sessionInfo.isActive': true
    },
    {
      $set: {
        'sessionInfo.isActive': false,
        'sessionInfo.sessionDuration': { $divide: [{ $subtract: [thirtyMinutesAgo, '$sessionInfo.checkedInAt'] }, 60000] }
      }
    }
  );
};

module.exports = mongoose.model('LiveAttendee', liveAttendeeSchema);