const express = require('express');
const router = express.Router();
const AudioSnippet = require('../models/snippetModel.cjs');
const User = require('../models/userModel.cjs');
const Song = require('../models/songModel.cjs');
const Event = require('../models/eventModel.cjs');
const Venue = require('../models/venueModel.cjs');

// GET /api/audio/feed - Get audio snippets feed
router.get('/feed', async (req, res) => {
  try {
    const { limit = 10, offset = 0, filter = 'all' } = req.query;

    // Build query based on filter
    let query = {};
    if (filter === 'featured') {
      query.featured = true;
    } else if (filter === 'recent') {
      // Recent snippets from last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: weekAgo };
    }

    // Get total count for pagination
    const total = await AudioSnippet.countDocuments(query);

    // Get snippets with pagination and populate related data
    const snippets = await AudioSnippet.find(query)
      .populate('creator', 'username email')
      .populate('artist', 'username')
      .populate('venue', 'name address')
      .populate('event', 'name')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Transform snippets to match frontend interface
    const transformedSnippets = snippets.map(snippet => ({
      _id: snippet._id,
      title: snippet.title,
      artist: snippet.artist?.username || 'Unknown Artist',
      url: snippet.audioFile?.url || '',
      duration: snippet.audioFile?.duration || 0,
      createdAt: snippet.createdAt,
      user: {
        _id: snippet.creator._id,
        username: snippet.creator.username,
        avatar: snippet.creator.profilePictureUrl
      },
      likes: snippet.stats?.likes || 0,
      plays: snippet.stats?.plays || 0,
      shares: snippet.stats?.shares || 0,
      hasLiked: false // TODO: Check if current user has liked
    }));

    res.json({
      snippets: transformedSnippets,
      total,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Error fetching audio feed:', error);
    res.status(500).json({
      error: 'Failed to fetch audio feed',
      message: error.message
    });
  }
});

// POST /api/audio/snippets - Upload new audio snippet
router.post('/snippets', async (req, res) => {
  try {
    const { title, artist, description, tags } = req.body;

    // TODO: Handle file upload with multer or similar
    // For now, create a placeholder snippet
    const snippet = new AudioSnippet({
      title,
      creator: req.user?.id || '60f7b3b3b3b3b3b3b3b3b3b3', // Placeholder user ID
      audioFile: {
        url: 'https://example.com/placeholder.mp3',
        duration: 30,
        format: 'mp3',
        size: 1024000
      },
      type: 'performance',
      privacy: 'public',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await snippet.save();

    res.status(201).json({
      _id: snippet._id,
      title: snippet.title,
      artist: artist || 'Unknown',
      url: snippet.audioFile.url,
      duration: snippet.audioFile.duration,
      createdAt: snippet.createdAt,
      user: {
        _id: snippet.creator,
        username: 'User',
        avatar: null
      },
      likes: 0,
      plays: 0,
      shares: 0
    });

  } catch (error) {
    console.error('Error uploading snippet:', error);
    res.status(500).json({
      error: 'Failed to upload snippet',
      message: error.message
    });
  }
});

// POST /api/audio/snippets/:id/like - Like a snippet
router.post('/snippets/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '60f7b3b3b3b3b3b3b3b3b3b3'; // Placeholder

    const snippet = await AudioSnippet.findById(id);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    // Check if user already liked
    const hasLiked = snippet.interactions.likedBy.includes(userId);

    if (hasLiked) {
      // Unlike
      snippet.interactions.likedBy.pull(userId);
      snippet.stats.likes = Math.max(0, snippet.stats.likes - 1);
    } else {
      // Like
      snippet.interactions.likedBy.push(userId);
      snippet.stats.likes += 1;
    }

    await snippet.save();

    res.json({
      likes: snippet.stats.likes,
      hasLiked: !hasLiked
    });

  } catch (error) {
    console.error('Error liking snippet:', error);
    res.status(500).json({
      error: 'Failed to like snippet',
      message: error.message
    });
  }
});

// POST /api/audio/snippets/:id/play - Record a play
router.post('/snippets/:id/play', async (req, res) => {
  try {
    const { id } = req.params;

    const snippet = await AudioSnippet.findById(id);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    // Increment play count
    snippet.stats.plays += 1;
    await snippet.save();

    res.json({
      plays: snippet.stats.plays
    });

  } catch (error) {
    console.error('Error recording play:', error);
    res.status(500).json({
      error: 'Failed to record play',
      message: error.message
    });
  }
});

// GET /api/audio/snippets/:id - Get specific snippet
router.get('/snippets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const snippet = await AudioSnippet.findById(id)
      .populate('creator', 'username email')
      .populate('artist', 'username')
      .populate('venue', 'name address')
      .populate('event', 'name');

    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    res.json({
      _id: snippet._id,
      title: snippet.title,
      artist: snippet.artist?.username || 'Unknown Artist',
      url: snippet.audioFile?.url || '',
      duration: snippet.audioFile?.duration || 0,
      createdAt: snippet.createdAt,
      user: {
        _id: snippet.creator._id,
        username: snippet.creator.username,
        avatar: snippet.creator.profilePictureUrl
      },
      likes: snippet.stats?.likes || 0,
      plays: snippet.stats?.plays || 0,
      shares: snippet.stats?.shares || 0,
      venue: snippet.venue ? {
        _id: snippet.venue._id,
        name: snippet.venue.name,
        address: snippet.venue.address
      } : null,
      event: snippet.event ? {
        _id: snippet.event._id,
        name: snippet.event.name
      } : null
    });

  } catch (error) {
    console.error('Error fetching snippet:', error);
    res.status(500).json({
      error: 'Failed to fetch snippet',
      message: error.message
    });
  }
});

// DELETE /api/audio/snippets/:id - Delete snippet
router.delete('/snippets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const snippet = await AudioSnippet.findById(id);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    // Check if user owns the snippet
    if (snippet.creator.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this snippet' });
    }

    await AudioSnippet.findByIdAndDelete(id);

    res.json({ message: 'Snippet deleted successfully' });

  } catch (error) {
    console.error('Error deleting snippet:', error);
    res.status(500).json({
      error: 'Failed to delete snippet',
      message: error.message
    });
  }
});

// GET /api/audio/search - Search audio snippets
router.get('/search', async (req, res) => {
  try {
    const { q, genre, venue, limit = 10, offset = 0 } = req.query;

    let query = {};

    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Filter by venue
    if (venue) {
      query.venue = venue;
    }

    const total = await AudioSnippet.countDocuments(query);

    const snippets = await AudioSnippet.find(query)
      .populate('creator', 'username email')
      .populate('artist', 'username')
      .populate('venue', 'name address')
      .sort({ 'stats.plays': -1, createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const transformedSnippets = snippets.map(snippet => ({
      _id: snippet._id,
      title: snippet.title,
      artist: snippet.artist?.username || 'Unknown Artist',
      url: snippet.audioFile?.url || '',
      duration: snippet.audioFile?.duration || 0,
      createdAt: snippet.createdAt,
      user: {
        _id: snippet.creator._id,
        username: snippet.creator.username,
        avatar: snippet.creator.profilePictureUrl
      },
      likes: snippet.stats?.likes || 0,
      plays: snippet.stats?.plays || 0,
      shares: snippet.stats?.shares || 0
    }));

    res.json({
      snippets: transformedSnippets,
      total,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Error searching snippets:', error);
    res.status(500).json({
      error: 'Failed to search snippets',
      message: error.message
    });
  }
});

module.exports = router;
