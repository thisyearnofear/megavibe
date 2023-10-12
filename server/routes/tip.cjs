const express = require('express');
const router = express.Router();
const Tip = require('../models/tip.cjs');

router.post('/', async (req, res) => {
  try {
    const { songId, amount } = req.body;
    const tip = new Tip({ songId, amount });
    await tip.save();
    res.status(201).json({ message: 'Tipping successful', tip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET route to accept a parameter
router.get('/:songId', async (req, res) => {
  try {
    // Extract the song ID from the request parameter
    const { songId } = req.params;

    // Query the database for a tip with the given song ID
    const tip = await Tip.findOne({ songId });

    // Check if a tip was found
    if (tip) {
      res.status(200).json(tip);
    } else {
      res.status(404).json({ message: 'Tip not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;