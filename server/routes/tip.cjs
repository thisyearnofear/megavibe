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

module.exports = router;
