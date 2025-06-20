const express = require('express');
const router = express.Router();

// Simple in-memory storage for MVP (replace with MongoDB later)
let curatedSpeakers = [];

// Simple auth middleware for MVP
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === 'simple_admin_token') {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Add new curated speaker
router.post('/speakers', adminAuth, async (req, res) => {
  try {
    const {
      address,
      name,
      bio,
      profileImage,
      socialLinks,
      featured,
      verified,
      source
    } = req.body;

    // Validate required fields
    if (!address || !name || !bio) {
      return res.status(400).json({ 
        message: 'Address, name, and bio are required' 
      });
    }

    // Check if speaker already exists
    const existingIndex = curatedSpeakers.findIndex(
      s => s.address.toLowerCase() === address.toLowerCase()
    );

    const speakerData = {
      address: address.toLowerCase(),
      name: name.trim(),
      bio: bio.trim(),
      profileImage: profileImage || '/api/placeholder/60/60',
      socialLinks: socialLinks || {},
      featured: featured || false,
      verified: verified || false,
      source: source || 'manual',
      addedBy: 'admin', // MVP: simple admin user
      addedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing speaker
      curatedSpeakers[existingIndex] = { 
        ...curatedSpeakers[existingIndex], 
        ...speakerData 
      };
      res.json(curatedSpeakers[existingIndex]);
    } else {
      // Add new speaker
      curatedSpeakers.push(speakerData);
      res.status(201).json(speakerData);
    }

  } catch (error) {
    console.error('Error adding speaker:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get curated speaker by address
router.get('/speakers/curated/:address', (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const speaker = curatedSpeakers.find(
      s => s.address.toLowerCase() === address
    );

    if (speaker) {
      res.json(speaker);
    } else {
      res.status(404).json({ message: 'Speaker not found' });
    }
  } catch (error) {
    console.error('Error getting speaker:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search curated speakers
router.get('/speakers/search', (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    
    const results = curatedSpeakers.filter(speaker =>
      speaker.name.toLowerCase().includes(query) ||
      speaker.bio.toLowerCase().includes(query) ||
      speaker.address.toLowerCase().includes(query)
    );

    res.json(results);
  } catch (error) {
    console.error('Error searching speakers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get featured speakers
router.get('/speakers/featured', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const featured = curatedSpeakers
      .filter(s => s.featured)
      .slice(0, limit);

    res.json(featured);
  } catch (error) {
    console.error('Error getting featured speakers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get admin stats
router.get('/stats', adminAuth, (req, res) => {
  try {
    const stats = {
      totalSpeakers: curatedSpeakers.length,
      farcasterSpeakers: 0, // TODO: Track this
      curatedSpeakers: curatedSpeakers.length,
      featuredSpeakers: curatedSpeakers.filter(s => s.featured).length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update speaker
router.put('/speakers/:address', adminAuth, (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const updates = req.body;

    const speakerIndex = curatedSpeakers.findIndex(
      s => s.address.toLowerCase() === address
    );

    if (speakerIndex >= 0) {
      curatedSpeakers[speakerIndex] = {
        ...curatedSpeakers[speakerIndex],
        ...updates,
        address // Don't allow address changes
      };
      res.json(curatedSpeakers[speakerIndex]);
    } else {
      res.status(404).json({ message: 'Speaker not found' });
    }
  } catch (error) {
    console.error('Error updating speaker:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
