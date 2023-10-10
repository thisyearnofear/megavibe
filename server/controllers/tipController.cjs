const Tip = require('../models/tip.cjs');

async function createTip(req, res) {
  try {
    const { songId, amount } = req.body;
    const tip = await Tip.create({ songId, amount });
    res.status(201).json({ message: 'Tipping successful', tip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getTips(req, res) {
  try {
    const tips = await Tip.find();
    res.status(200).json(tips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createTip,
  getTips,
};
