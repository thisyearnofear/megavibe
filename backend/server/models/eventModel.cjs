const mongoose = require('mongoose');

const setlistItemSchema = new mongoose.Schema({
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  },
  order: Number,
  plannedStartTime: Date,
  actualStartTime: Date,
  duration: Number, // in seconds
  status: {
    type: String,
    enum: ['planned', 'playing', 'completed', 'skipped'],
    default: 'planned'
  },
  tips: {
    count: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  reactions: {
    love: { type: Number, default: 0 },
    fire: { type: Number, default: 0 },
    clap: { type: Number, default: 0 },
    wow: { type: Number, default: 0 }
  }
});

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['open_mic', 'concert', 'dj_set', 'karaoke', 'acoustic', 'band_night', 'other'],
    required: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  artists: [{
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performanceOrder: Number,
    setDuration: Number, // minutes
    fee: Number,
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled'],
      default: 'pending'
    }
  }],
  setlist: [setlistItemSchema],
  currentSong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  },
  description: String,
  coverImage: String,
  ticketInfo: {
    price: Number,
    currency: { type: String, default: 'USD' },
    availableTickets: Number,
    soldTickets: { type: Number, default: 0 }
  },
  bounties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bounty'
  }],
  attendance: {
    expected: Number,
    checkedIn: { type: Number, default: 0 },
    peak: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  analytics: {
    totalTips: { type: Number, default: 0 },
    totalBounties: { type: Number, default: 0 },
    totalReactions: { type: Number, default: 0 },
    topSongs: [{
      songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
      tips: Number,
      reactions: Number
    }],
    audienceEngagement: { type: Number, default: 0 }, // 0-100 score
    peakViewers: { type: Number, default: 0 }
  },
  restrictions: {
    ageLimit: Number,
    dresscode: String,
    capacity: Number
  },
  promotions: [{
    type: { type: String, enum: ['early_bird', 'group', 'student', 'vip'] },
    discount: Number,
    code: String,
    validUntil: Date,
    usageLimit: Number,
    usageCount: { type: Number, default: 0 }
  }],
  livestream: {
    enabled: { type: Boolean, default: false },
    platform: String,
    url: String,
    viewers: { type: Number, default: 0 }
  },
  recordings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioSnippet'
  }],
  feedback: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for finding events by date range
eventSchema.index({ startTime: 1, endTime: 1 });

// Index for finding live events
eventSchema.index({ status: 1, startTime: 1 });

// Virtual to check if event is currently live
eventSchema.virtual('isLive').get(function() {
  const now = new Date();
  return this.status === 'live' || 
    (this.status === 'scheduled' && 
     now >= this.startTime && 
     now <= this.endTime);
});

// Method to update current song
eventSchema.methods.updateCurrentSong = async function(songId) {
  const setlistItem = this.setlist.find(item => 
    item.songId.toString() === songId.toString()
  );
  
  if (setlistItem) {
    // Update previous song status
    const currentIndex = this.setlist.findIndex(item => 
      item.status === 'playing'
    );
    if (currentIndex !== -1) {
      this.setlist[currentIndex].status = 'completed';
    }
    
    // Update new song status
    setlistItem.status = 'playing';
    setlistItem.actualStartTime = new Date();
  }
  
  this.currentSong = songId;
  return this.save();
};

// Method to get live stats
eventSchema.methods.getLiveStats = function() {
  const totalTips = this.setlist.reduce((sum, item) => 
    sum + item.tips.total, 0
  );
  
  const totalReactions = this.setlist.reduce((sum, item) => 
    sum + item.reactions.love + 
    item.reactions.fire + 
    item.reactions.clap + 
    item.reactions.wow, 0
  );
  
  return {
    totalTips,
    totalReactions,
    currentAttendance: this.attendance.checkedIn,
    songsPlayed: this.setlist.filter(item => 
      item.status === 'completed'
    ).length,
    songsRemaining: this.setlist.filter(item => 
      item.status === 'planned'
    ).length
  };
};

// Static method to find live events at venues
eventSchema.statics.findLiveEvents = function(venueIds = []) {
  const query = {
    status: 'live'
  };
  
  if (venueIds.length > 0) {
    query.venue = { $in: venueIds };
  }
  
  return this.find(query)
    .populate('venue', 'name address')
    .populate('artists.artistId', 'username profilePictureUrl')
    .populate('currentSong', 'title artist');
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
