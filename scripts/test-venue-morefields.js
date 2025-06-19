// scripts/test-venue-morefields.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const venueMoreFieldsSchema = new mongoose.Schema(
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
    capacity: Number,
    isActive: { type: Boolean, default: false },
    amenities: [String],
  },
  { collection: "venues" }
);

const VenueMoreFields = mongoose.model(
  "VenueMoreFields",
  venueMoreFieldsSchema
);

async function testVenueMoreFields() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    const name = "More Fields Venue";
    let venue = await VenueMoreFields.findOne({ name });
    if (!venue) {
      venue = await VenueMoreFields.create({
        name,
        address: "789 More St",
        location: { type: "Point", coordinates: [30, 40] },
        capacity: 200,
        isActive: true,
        amenities: ["WiFi", "Bar"],
      });
      console.log("Created venue with more fields:", venue.name);
    } else {
      console.log("Venue with more fields already exists:", venue.name);
    }
    await mongoose.disconnect();
    console.log("Venue more fields test complete.");
  } catch (err) {
    console.error("Venue more fields test failed:", err);
    process.exit(1);
  }
}

testVenueMoreFields();
