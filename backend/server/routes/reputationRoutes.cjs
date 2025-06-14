const express = require('express');
const router = express.Router();
const {
  getUserReputation,
  getReputationLeaderboard,
  recordProofOfPresence,
  updateReputationScore,
  verifyTastePrediction,
  getMarketplaceAccess,
  getReputationAnalytics
} = require('../controllers/reputationController.cjs');

// User reputation routes
router.get('/user/:userId', getUserReputation);
router.get('/user/:userId/analytics', getReputationAnalytics);
router.get('/user/:userId/marketplace-access', getMarketplaceAccess);

// Leaderboard
router.get('/leaderboard', getReputationLeaderboard);

// Proof of presence
router.post('/proof-of-presence', recordProofOfPresence);

// Reputation updates
router.post('/update-score', updateReputationScore);

// Taste verification
router.post('/verify-prediction', verifyTastePrediction);

module.exports = router;