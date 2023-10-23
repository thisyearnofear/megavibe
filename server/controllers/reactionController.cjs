const Reaction = require('../models/reactionModel.cjs');
const { handleError } = require('../utils/errorHandlers'); // Import your error handling module

// Add a new reaction
exports.addReaction = async (req, res) => {
  try {
    const { userId, songId, rating } = req.body;
    const reaction = await Reaction.create({ userId, songId, rating });
    res.status(201).json(reaction);
  } catch (error) {
    handleError(res, error); // Use your error handling function
  }
};

// Update an existing reaction
exports.updateReaction = async (req, res) => {
  try {
    // Logic for updating an existing reaction
    // This function will be implemented here
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a reaction
exports.deleteReaction = async (req, res) => {
  try {
    // Logic for deleting a reaction
    // This function will be implemented here
  } catch (error) {
    handleError(res, error);
  }
};

// Get reactions for a specific song
exports.getReactions = async (req, res) => {
  try {
    const reactions = await Reaction.find();
    res.status(200).json(reactions);
  } catch (error) {
    handleError(res, error);
  }
};
