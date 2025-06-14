const { create, findOne, findById } = require("../models/userModel.cjs");
const { generateToken } = require("../utils/token.cjs");
const { handleError } = require("../utils/errorHandler.cjs"); // Import your error handling module

async function registerUser(req, res) {
  const { name, email, password } = req.body;

  try {
    const user = await create({ name, email, password });
    res.status(201).json(user);
  } catch (err) {
    handleError(res, err);
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    const user = await findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.checkPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.json({ token });
  } catch (err) {
    handleError(res, err);
  }
}

async function getUserProfile(req, res) {
  try {
    const user = await findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
}

async function rateSong(req, res) {
  const { songId, rating } = req.body;

  try {
    const user = await findById(req.user._id);

    user.ratings.push({ songId, rating });

    await user.save();

    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  rateSong,
};
