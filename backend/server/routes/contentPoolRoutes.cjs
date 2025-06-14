const express = require('express');
const router = express.Router();
const {
  createContentPool,
  getContentPools,
  contributeToPool,
  trackSnippetUsage,
  voteForSnippetInPool,
  trackViralRevenue,
  groupSnippetsByPerspective,
  mintSnippetAsNFT,
} = require('../controllers/contentPoolController.cjs');

// Content pool management
router.post('/', createContentPool);
router.get('/', getContentPools);

// Pool contributions
router.post('/contribute', contributeToPool);
router.post('/track-usage', trackSnippetUsage);

// Voting and curation
router.post('/vote', voteForSnippetInPool);

// Revenue tracking
router.post('/track-viral', trackViralRevenue);

// Perspective grouping
router.get('/perspectives', groupSnippetsByPerspective);

// NFT minting
router.post('/mint-nft', mintSnippetAsNFT);

module.exports = router;