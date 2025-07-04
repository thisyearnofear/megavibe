// scripts/test-venue-minimal.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const minimalVenueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
  },
  { collection: "venues" }
);

const MinimalVenue = mongoose.model("MinimalVenue", minimalVenueSchema);

async function testMinimalVenue() {
  try {
    await mongoose.connect(import.meta.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    const name = "Minimal Test Venue";
    let venue = await MinimalVenue.findOne({ name });
    if (!venue) {
      venue = await MinimalVenue.create({ name, address: "123 Minimal St" });
      console.log("Created minimal venue:", venue.name);
    } else {
      console.log("Minimal venue already exists:", venue.name);
    }
    await mongoose.disconnect();
    console.log("Minimal venue test complete.");
  } catch (err) {
    console.error("Minimal venue test failed:", err);
    process.exit(1);
  }
}

testMinimalVenue();
