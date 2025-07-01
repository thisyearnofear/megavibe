// MetaMask SDK Primary Authentication Controller
// Handles wallet-based authentication with signature verification

const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel.cjs');
const { handleError } = require('../utils/errorHandler.cjs');

// Wallet-based sign-in with signature verification
async function walletSignIn(req, res) {
  try {
    const { address, signature, message, timestamp, authMethod } = req.body;

    // Validate required fields
    if (!address || !signature || !message || !timestamp) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Address, signature, message, and timestamp are required'
      });
    }

    // Validate timestamp (should be within last 5 minutes)
    const now = Date.now();
    const messageAge = now - timestamp;
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (messageAge > maxAge) {
      return res.status(400).json({
        error: 'Message expired',
        message: 'Authentication message is too old. Please try again.'
      });
    }

    // Verify signature
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid signature',
        message: 'Signature verification failed'
      });
    }

    // Check if recovered address matches provided address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        error: 'Address mismatch',
        message: 'Signature does not match the provided address'
      });
    }

    // Find or create user based on wallet address
    let user = await User.findOne({ walletAddress: address.toLowerCase() });
    
    if (!user) {
      // Create new user with wallet address as primary identifier
      user = new User({
        username: `user_${address.slice(2, 8)}`, // Generate username from address
        email: `${address.toLowerCase()}@wallet.megavibe.app`, // Virtual email
        walletAddress: address.toLowerCase(),
        authMethod: authMethod || 'metamask',
        profile: {
          isWalletUser: true,
          createdVia: authMethod || 'metamask'
        },
        reputation: {
          score: 0,
          level: 'Newcomer',
          badges: []
        }
      });

      await user.save();
    } else {
      // Update last login and auth method
      user.lastLogin = new Date();
      user.authMethod = authMethod || user.authMethod;
      await user.save();
    }

    // Generate JWT session token
    const sessionToken = jwt.sign(
      {
        userId: user._id,
        address: address.toLowerCase(),
        authMethod: authMethod || 'metamask'
      },
      process.env.JWT_SECRET || 'megavibe-secret',
      { expiresIn: '24h' }
    );

    // Create session in database/memory
    req.session.userId = user._id;
    req.session.walletAddress = address.toLowerCase();
    req.session.authMethod = authMethod || 'metamask';
    req.session.isAuthenticated = true;

    // Return user data and session token
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        walletAddress: user.walletAddress,
        authMethod: user.authMethod,
        profile: {
          name: user.profile?.name || user.username,
          avatar: user.profile?.avatar,
          isWalletUser: true
        },
        reputation: user.reputation?.score || 0,
        createdAt: user.createdAt
      },
      sessionToken,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Wallet sign-in error:', error);
    handleError(res, error, {
      statusCode: 500,
      message: 'Authentication failed'
    });
  }
}

// Create session for non-wallet authentication (Dynamic, Social)
async function createSession(req, res) {
  try {
    const { userId, authMethod, profile } = req.body;

    if (!userId || !authMethod) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID and auth method are required'
      });
    }

    // Find or create user
    let user = await User.findById(userId);
    
    if (!user) {
      // Create new user for social/dynamic auth
      user = new User({
        username: profile?.name || `user_${Date.now()}`,
        email: profile?.email || `${userId}@${authMethod}.megavibe.app`,
        authMethod,
        profile: {
          name: profile?.name,
          email: profile?.email,
          avatar: profile?.avatar,
          isWalletUser: authMethod !== 'social'
        },
        reputation: {
          score: 0,
          level: 'Newcomer',
          badges: []
        }
      });

      await user.save();
    }

    // Generate session token
    const sessionToken = jwt.sign(
      {
        userId: user._id,
        authMethod
      },
      process.env.JWT_SECRET || 'megavibe-secret',
      { expiresIn: '24h' }
    );

    // Create session
    req.session.userId = user._id;
    req.session.authMethod = authMethod;
    req.session.isAuthenticated = true;

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        authMethod: user.authMethod,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Session creation error:', error);
    handleError(res, error, {
      statusCode: 500,
      message: 'Session creation failed'
    });
  }
}

// Get current user information
async function getCurrentUser(req, res) {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'No valid session found'
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        authMethod: user.authMethod,
        profile: user.profile,
        reputation: user.reputation?.score || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    handleError(res, error, {
      statusCode: 500,
      message: 'Failed to get user information'
    });
  }
}

// Logout user
async function logout(req, res) {
  try {
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({
          error: 'Logout failed',
          message: 'Failed to clear session'
        });
      }

      // Clear session cookie
      res.clearCookie('connect.sid');
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });

  } catch (error) {
    console.error('Logout error:', error);
    handleError(res, error, {
      statusCode: 500,
      message: 'Logout failed'
    });
  }
}

// Refresh user data and session
async function refreshUser(req, res) {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'No valid session found'
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    // Update last activity
    user.lastLogin = new Date();
    await user.save();

    // Generate new session token
    const sessionToken = jwt.sign(
      {
        userId: user._id,
        address: user.walletAddress,
        authMethod: user.authMethod
      },
      process.env.JWT_SECRET || 'megavibe-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        authMethod: user.authMethod,
        profile: user.profile,
        reputation: user.reputation?.score || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      sessionToken
    });

  } catch (error) {
    console.error('Refresh user error:', error);
    handleError(res, error, {
      statusCode: 500,
      message: 'Failed to refresh user data'
    });
  }
}

module.exports = {
  walletSignIn,
  createSession,
  getCurrentUser,
  logout,
  refreshUser
};
