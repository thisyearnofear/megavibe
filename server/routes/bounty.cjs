const express = require('express');
const router = express.Router();
const Bounty = require('../models/bounty.cjs');

router.post('/', async (req, res) => {
  try {
    const { userId, songId, bountyAmount } = req.body;

    const bounty = new Bounty({ userId, songId, bountyAmount });
    await bounty.save();

    res.status(201).json({ message: 'Bounty created', bounty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
