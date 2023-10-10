const Reaction = require('../models/reaction.cjs');

async function createReaction(req, res) {
  try {
    const { userId, songId, rating } = req.body;
    const reaction = await Reaction.create({ userId, songId, rating });
    res.status(201).json(reaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getReactions(req, res) {
  try {
    const reactions = await Reaction.find();
    res.status(200).json(reactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createReaction,
  getReactions,
};
