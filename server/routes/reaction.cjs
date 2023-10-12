const express = require('express');
const router = express.Router();
const Reaction = require('../models/reaction.cjs');

router.post('/', async (req, res) => {
  try {
    const { userId, songId, rating } = req.body;
    const reaction = new Reaction({ userId, songId, rating });
    await reaction.save();
    res.status(201).json(reaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Reactions (GET request)
router.get('/', async (req, res) => {
  try {
    // Fetch and send the list of reactions
    const reactions = await Reaction.find();
    res.status(200).json(reactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
