const mongoose = require("mongoose");

// Explicitly set collection name for Venue model
const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    capacity: Number,
    isActive: {
      type: Boolean,
      default: false,
    },
    amenities: [String],
    contactInfo: {
      phone: String,
      email: String,
      website: String,
    },
    socialLinks: {
      instagram: String,
      facebook: String,
      twitter: String,
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    currentEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    upcomingEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    pastEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    ratings: {
      overall: { type: Number, default: 0 },
      sound: { type: Number, default: 0 },
      atmosphere: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
    },
  },
  {
    collection: "venues",
  }
);

// Index for geospatial queries
venueSchema.index({ location: "2dsphere" });

// Index for text search
venueSchema.index({
  name: "text",
  address: "text",
  description: "text",
});

// Virtual for calculating distance (will be populated by query)
venueSchema.virtual("distance").get(function () {
  return this._distance;
});

// Method to check if venue is open
venueSchema.methods.isOpen = function (date = new Date()) {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const day = dayNames[date.getDay()];
  const hours = this.operatingHours[day];

  if (!hours || !hours.open || !hours.close) return false;

  const currentTime = date.getHours() * 60 + date.getMinutes();
  const [openHour, openMin] = hours.open.split(":").map(Number);
  const [closeHour, closeMin] = hours.close.split(":").map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Handle venues that close after midnight
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }

  return currentTime >= openTime && currentTime <= closeTime;
};

// Static method to find nearby venues
venueSchema.statics.findNearby = async function (
  coordinates,
  maxDistance = 5000
) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: coordinates, // [longitude, latitude]
        },
        distanceField: "distance",
        maxDistance: maxDistance, // in meters
        spherical: true,
      },
    },
    {
      $lookup: {
        from: "events",
        localField: "currentEvent",
        foreignField: "_id",
        as: "currentEventDetails",
      },
    },
    {
      $unwind: {
        path: "$currentEventDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);
};

const Venue = mongoose.model("Venue", venueSchema);

module.exports = Venue;
