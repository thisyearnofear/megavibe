// scripts/test-venue-refs.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const venueRefsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    currentEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    upcomingEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    pastEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    ratings: {
      overall: { type: Number, default: 0 },
      sound: { type: Number, default: 0 },
      atmosphere: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
    },
  },
  { collection: "venues" }
);

const VenueRefs = mongoose.model("VenueRefs", venueRefsSchema);

async function testVenueRefs() {
  try {
    await mongoose.connect(import.meta.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    const name = "Refs Venue";
    let venue = await VenueRefs.findOne({ name });
    if (!venue) {
      venue = await VenueRefs.create({
        name,
        address: "202 Refs St",
        location: { type: "Point", coordinates: [70, 80] },
        currentEvent: null,
        upcomingEvents: [],
        pastEvents: [],
        ratings: { overall: 4, sound: 5, atmosphere: 4, service: 5 },
      });
      console.log("Created venue with refs/ratings:", venue.name);
    } else {
      console.log("Venue with refs/ratings already exists:", venue.name);
    }
    await mongoose.disconnect();
    console.log("Venue refs/ratings test complete.");
  } catch (err) {
    console.error("Venue refs/ratings test failed:", err);
    process.exit(1);
  }
}

testVenueRefs();
