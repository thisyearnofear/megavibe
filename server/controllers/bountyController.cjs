const Bounty = require('../models/bounty.cjs');

async function createBounty(req, res) {
  try {
    const { userId, songId, bountyAmount } = req.body;
    const bounty = await Bounty.create({ userId, songId, bountyAmount });
    res.status(201).json({ message: 'Bounty created', bounty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getBounties(req, res) {
  try {
    const bounties = await Bounty.find();
    res.status(200).json(bounties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createBounty,
  getBounties,
};
