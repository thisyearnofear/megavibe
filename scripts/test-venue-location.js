// scripts/test-venue-location.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const venueLocationSchema = new mongoose.Schema(
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
  },
  { collection: "venues" }
);

const VenueLocation = mongoose.model("VenueLocation", venueLocationSchema);

async function testVenueLocation() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    const name = "Location Test Venue";
    let venue = await VenueLocation.findOne({ name });
    if (!venue) {
      venue = await VenueLocation.create({
        name,
        address: "456 Geo St",
        location: { type: "Point", coordinates: [10, 20] },
      });
      console.log("Created venue with location:", venue.name);
    } else {
      console.log("Venue with location already exists:", venue.name);
    }
    await mongoose.disconnect();
    console.log("Venue location test complete.");
  } catch (err) {
    console.error("Venue location test failed:", err);
    process.exit(1);
  }
}

testVenueLocation();
