// scripts/drop-megavibe-collections.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

async function dropCollections() {
  try {
    await mongoose.connect(import.meta.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    const collections = ["venues", "events", "users", "bounties"];
    for (const name of collections) {
      try {
        await mongoose.connection.db.dropCollection(name);
        console.log(`Dropped collection: ${name}`);
      } catch (err) {
        if (err.codeName === "NamespaceNotFound") {
          console.log(`Collection not found (skipped): ${name}`);
        } else {
          throw err;
        }
      }
    }
    await mongoose.disconnect();
    console.log("All done.");
  } catch (err) {
    console.error("Error dropping collections:", err);
    process.exit(1);
  }
}

dropCollections();
