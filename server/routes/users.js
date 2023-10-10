const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

// Route handler for user registration
router.post("/register", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await User.register(newUser, req.body.password); // Register user with Passport.js
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route handler for user login
router.post("/login", passport.authenticate("local"), (req, res) => {
  // Authentication is successful, respond accordingly
  res.status(200).json({ message: "Login successful" });
});

// Route handler for getting user profile
router.get("/profile/:userId", async (req, res) => {
  try {
    const {userId} = req.params;
    // Fetch user profile from the database based on userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Return the user's profile data
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route handler for rating a song
router.post("/rate-song", async (req, res) => {
  try {
    const { userId, songId, rating } = req.body;
    // Fetch the user based on userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Perform the logic to rate a song, e.g., update the user's interactions
    // For example, add the rating to the user's interactions
    user.interactions.push({ songId, rating });
    // Save the updated user document
    await user.save();
    // Example response:
    res.status(200).json({ message: "Song rated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route handler for updating user profile
router.put("/update-profile/:userId", async (req, res) => {
  try {
    const {userId} = req.params;
    const updatedProfileData = req.body;
    // Fetch the user based on userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Implement the logic to update the user's profile data
    // For example, update the user's profile fields with updatedProfileData
    user.username = updatedProfileData.username;
    user.email = updatedProfileData.email;
    user.country = updatedProfileData.country;
    user.favorite_genres = updatedProfileData.favorite_genres;
    user.profile_picture_url = updatedProfileData.profile_picture_url;
    // ... update other fields as needed
    // Save the updated user document
    await user.save();
    // Example response:
    res.status(200).json({ message: "User profile updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
