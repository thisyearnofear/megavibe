// scripts/test-venue-nestedfields.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const venueNestedFieldsSchema = new mongoose.Schema(
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
  },
  { collection: "venues" }
);

const VenueNestedFields = mongoose.model(
  "VenueNestedFields",
  venueNestedFieldsSchema
);

async function testVenueNestedFields() {
  try {
    await mongoose.connect(import.meta.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    const name = "Nested Fields Venue";
    let venue = await VenueNestedFields.findOne({ name });
    if (!venue) {
      venue = await VenueNestedFields.create({
        name,
        address: "101 Nested St",
        location: { type: "Point", coordinates: [50, 60] },
        capacity: 300,
        isActive: true,
        amenities: ["Stage", "Lighting"],
        contactInfo: {
          phone: "123-456-7890",
          email: "venue@example.com",
          website: "https://venue.com",
        },
        socialLinks: {
          instagram: "@venue",
          facebook: "venuefb",
          twitter: "@venue",
        },
        operatingHours: {
          monday: { open: "09:00", close: "22:00" },
          tuesday: { open: "09:00", close: "22:00" },
          wednesday: { open: "09:00", close: "22:00" },
          thursday: { open: "09:00", close: "22:00" },
          friday: { open: "09:00", close: "23:00" },
          saturday: { open: "10:00", close: "23:00" },
          sunday: { open: "10:00", close: "20:00" },
        },
      });
      console.log("Created venue with nested fields:", venue.name);
    } else {
      console.log("Venue with nested fields already exists:", venue.name);
    }
    await mongoose.disconnect();
    console.log("Venue nested fields test complete.");
  } catch (err) {
    console.error("Venue nested fields test failed:", err);
    process.exit(1);
  }
}

testVenueNestedFields();
