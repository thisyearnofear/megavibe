// models/Waitlist.js
const mongoose = require("mongoose");

const WaitlistSchema = new mongoose.Schema({
  name: String,
  email: String,
  link: String,
});

module.exports = mongoose.model("Waitlist", WaitlistSchema);
