const express = require('express');
const router = express.Router();
const Bounty = require('../models/bountyModel.cjs');

// Mock bounties for development
const MOCK_BOUNTIES = [
  {
    id: 'bounty-1',
    contractBountyId: 1,
    sponsor: { username: 'CryptoWizard', avatar: '🧙‍♂️' },
    speaker: { username: 'VitalikButerin', avatar: '👨‍💻' },
    description: 'Create a 5-minute video explaining Layer 2 scaling solutions',
    rewardAmount: 250,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    timeRemaining: 7 * 24 * 60 * 60 * 1000
  },
  {
    id: 'bounty-2',
    contractBountyId: 2,
    sponsor: { username: 'DeFiDave', avatar: '💰' },
    speaker: { username: 'StaniKulechov', avatar: '🏦' },
    description: 'Record a detailed walkthrough of Aave v3 features',
    rewardAmount: 500,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    timeRemaining: 5 * 24 * 60 * 60 * 1000
  },
  {
    id: 'bounty-3',
    contractBountyId: 3,
    sponsor: { username: 'NFTNinja', avatar: '🥷' },
    speaker: { username: 'GavinWood', avatar: '🌐' },
    description: 'Explain Polkadot parachain architecture in simple terms',
    rewardAmount: 750,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    timeRemaining: 3 * 24 * 60 * 60 * 1000
  }
];

// Create bounty
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

// Create bounty (new endpoint)
router.post('/create', async (req, res) => {
  try {
    const { eventId, speakerId, description, rewardAmount, deadline } = req.body;
    
    // For now, return mock success
    const newBounty = {
      id: `bounty-${Date.now()}`,
      contractBountyId: Math.floor(Math.random() * 1000),
      eventId,
      speakerId,
      description,
      rewardAmount,
      deadline,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ 
      message: 'Bounty created successfully', 
      bounty: newBounty 
    });
  } catch (error) {
    console.error('Error creating bounty:', error);
    res.status(500).json({ message: 'Failed to create bounty' });
  }
});

// Get bounties for event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Return mock bounties for now
    const eventBounties = MOCK_BOUNTIES.filter(bounty => 
      bounty.status === 'active' && 
      new Date(bounty.deadline) > new Date()
    );

    const stats = {
      totalBounties: MOCK_BOUNTIES.length,
      totalReward: MOCK_BOUNTIES.reduce((sum, b) => sum + b.rewardAmount, 0),
      activeBounties: eventBounties.length,
      claimedBounties: MOCK_BOUNTIES.filter(b => b.status === 'claimed').length
    };

    res.status(200).json({
      bounties: eventBounties,
      stats
    });
  } catch (error) {
    console.error('Error fetching bounties:', error);
    res.status(400).json({ message: 'Failed to fetch bounties' });
  }
});

// Get all bounties
router.get('/', async (req, res) => {
  try {
    // Return mock bounties for development
    res.status(200).json(MOCK_BOUNTIES);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
