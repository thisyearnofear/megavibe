// MetaMask SDK Primary Authentication Routes
// Handles wallet-first authentication endpoints

const express = require('express');
const router = express.Router();
const {
  walletSignIn,
  createSession,
  getCurrentUser,
  logout,
  refreshUser
} = require('../controllers/authController.cjs');
const { verifySession } = require('../middleware/verifySession.cjs');

// Wallet-based authentication (MetaMask SDK primary)
router.post('/wallet-signin', walletSignIn);

// Session creation for non-wallet auth (Dynamic, Social)
router.post('/create-session', createSession);

// Get current authenticated user
router.get('/me', verifySession, getCurrentUser);

// Refresh user data and session
router.post('/refresh', verifySession, refreshUser);

// Logout
router.post('/logout', logout);

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    methods: ['metamask', 'dynamic', 'social']
  });
});

module.exports = router;
