const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    index: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  description: String,
  capacity: Number,
  amenities: [String],
  images: [String],
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  socialLinks: {
    instagram: String,
    facebook: String,
    twitter: String
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  isActive: { 
    type: Boolean, 
    default: false 
  },
  currentEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  upcomingEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  pastEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  preferredGenres: [String],
  equipment: {
    soundSystem: String,
    lighting: String,
    stage: String,
    other: [String]
  },
  policies: {
    ageRestriction: String,
    dresscode: String,
    coverCharge: Number,
    reservations: Boolean
  },
  ratings: {
    overall: { type: Number, default: 0 },
    sound: { type: Number, default: 0 },
    atmosphere: { type: Number, default: 0 },
    service: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  analytics: {
    totalEvents: { type: Number, default: 0 },
    totalTips: { type: Number, default: 0 },
    totalBounties: { type: Number, default: 0 },
    avgAttendance: { type: Number, default: 0 },
    topGenres: [String],
    peakHours: [Number]
  },
  partnerships: [{
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['resident', 'featured', 'regular'] },
    since: Date
  }],
  commissionRate: { 
    type: Number, 
    default: 0.1, // 10% default commission on tips
    min: 0,
    max: 0.5
  },
  payoutInfo: {
    method: { type: String, enum: ['bank', 'crypto', 'stripe'] },
    details: mongoose.Schema.Types.Mixed
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for geospatial queries
venueSchema.index({ location: '2dsphere' });

// Index for text search
venueSchema.index({ 
  name: 'text', 
  address: 'text', 
  description: 'text' 
});

// Virtual for calculating distance (will be populated by query)
venueSchema.virtual('distance').get(function() {
  return this._distance;
});

// Method to check if venue is open
venueSchema.methods.isOpen = function(date = new Date()) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = dayNames[date.getDay()];
  const hours = this.operatingHours[day];
  
  if (!hours || !hours.open || !hours.close) return false;
  
  const currentTime = date.getHours() * 60 + date.getMinutes();
  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  // Handle venues that close after midnight
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }
  
  return currentTime >= openTime && currentTime <= closeTime;
};

// Static method to find nearby venues
venueSchema.statics.findNearby = async function(coordinates, maxDistance = 5000) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: coordinates // [longitude, latitude]
        },
        distanceField: 'distance',
        maxDistance: maxDistance, // in meters
        spherical: true
      }
    },
    {
      $lookup: {
        from: 'events',
        localField: 'currentEvent',
        foreignField: '_id',
        as: 'currentEventDetails'
      }
    },
    {
      $unwind: {
        path: '$currentEventDetails',
        preserveNullAndEmptyArrays: true
      }
    }
  ]);
};

const Venue = mongoose.model('Venue', venueSchema);

module.exports = Venue;
