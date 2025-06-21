// scripts/test-mongo-connection.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

async function testConnection() {
  try {
    await mongoose.connect(import.meta.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connection successful!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

testConnection();
