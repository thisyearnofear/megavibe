// models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date },
  country: { type: String },
  favoriteGenres: [{ type: String }],
  profilePictureUrl: { type: String },
  following: [{ type: String }], // Store user IDs of followed artists
  interactions: [
    {
      songId: { type: String },
      rating: { type: Number },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
