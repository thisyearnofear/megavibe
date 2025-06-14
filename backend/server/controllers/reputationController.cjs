const UserReputation = require('../models/reputationModel.cjs');
const websocketService = require('../services/websocket.cjs');
const mantleService = require('../services/mantleService.cjs');

/**
 * Get user's reputation profile
 */
async function getUserReputation(req, res, next) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    let reputation = await UserReputation.findOne({ userId })
      .populate('presenceNFTs.eventId', 'name startTime endTime')
      .populate('presenceNFTs.venueId', 'name address');

    // Create reputation profile if it doesn't exist
    if (!reputation) {
      reputation = await UserReputation.create({
        userId,
        walletAddress: req.body.walletAddress || req.user?.walletAddress || 'unknown'
      });
    }

    res.status(200).json({
      message: 'User reputation retrieved successfully',
      reputation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get reputation leaderboard
 */
async function getReputationLeaderboard(req, res, next) {
  try {
    const { 
      category = 'overall', 
      limit = 50, 
      page = 1,
      timeframe = 'all' 
    } = req.query;

    let sortField = 'overallScore';
    
    // Determine sort field based on category
    switch (category) {
      case 'curator':
        sortField = 'categories.curator.score';
        break;
      case 'supporter':
        sortField = 'categories.supporter.score';
        break;
      case 'attendee':
        sortField = 'categories.attendee.score';
        break;
      case 'influencer':
        sortField = 'categories.influencer.score';
        break;
      default:
        sortField = 'overallScore';
    }

    const skip = (page - 1) * limit;
    
    // Build aggregation pipeline for leaderboard
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $sort: { [sortField]: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          userId: 1,
          overallScore: 1,
          categories: 1,
          reputationLevel: 1,
          percentile: 1,
          crossEventMetrics: 1,
          achievements: { $slice: ['$achievements', -5] }, // Last 5 achievements
          'user.username': 1,
          'user.avatar': 1,
          'user.email': 1
        }
      }
    ];

    const leaderboard = await UserReputation.aggregate(pipeline);
    const total = await UserReputation.countDocuments();

    res.status(200).json({
      message: 'Reputation leaderboard retrieved successfully',
      leaderboard,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      category,
      timeframe
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record proof of presence and mint NFT
 */
async function recordProofOfPresence(req, res, next) {
  try {
    const { 
      userId, 
      eventId, 
      venueId, 
      verificationMethod = 'GPS',
      metadata = {} 
    } = req.body;

    if (!userId || !eventId || !venueId) {
      return res.status(400).json({ 
        message: 'User ID, Event ID, and Venue ID are required' 
      });
    }

    // Get user reputation
    let reputation = await UserReputation.findOne({ userId });
    if (!reputation) {
      reputation = await UserReputation.create({
        userId,
        walletAddress: req.body.walletAddress || 'unknown'
      });
    }

    // Check if already has presence NFT for this event
    const existingNFT = reputation.presenceNFTs.find(
      nft => nft.eventId.toString() === eventId && nft.venueId.toString() === venueId
    );

    if (existingNFT) {
      return res.status(400).json({ 
        message: 'Presence already recorded for this event' 
      });
    }

    // Mint NFT on blockchain (placeholder for actual implementation)
    const nftResult = await mintPresenceNFT({
      userId,
      eventId,
      venueId,
      verificationMethod,
      metadata
    });

    // Add presence NFT to reputation
    const nftData = {
      tokenId: nftResult.tokenId,
      contractAddress: nftResult.contractAddress,
      eventId,
      venueId,
      eventName: req.body.eventName || 'Unknown Event',
      venueName: req.body.venueName || 'Unknown Venue',
      attendanceDate: new Date(),
      verificationMethod,
      metadata: {
        duration: metadata.duration || 0,
        interactions: metadata.interactions || 0,
        socialShares: metadata.socialShares || 0
      }
    };

    await reputation.addPresenceNFT(nftData);

    // Broadcast achievement to venue
    if (venueId) {
      websocketService.broadcastToVenue(venueId, {
        type: 'PRESENCE_NFT_MINTED',
        userId,
        eventId,
        tokenId: nftResult.tokenId,
        message: 'New presence NFT minted for event attendance!'
      });
    }

    res.status(201).json({
      message: 'Proof of presence recorded and NFT minted successfully',
      nft: nftData,
      reputation: {
        overallScore: reputation.overallScore,
        reputationLevel: reputation.reputationLevel,
        newAchievements: reputation.checkAchievements()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update reputation based on user action
 */
async function updateReputationScore(req, res, next) {
  try {
    const { 
      userId, 
      action, 
      points, 
      category, 
      eventDetails = {} 
    } = req.body;

    if (!userId || !action || points === undefined || !category) {
      return res.status(400).json({ 
        message: 'User ID, action, points, and category are required' 
      });
    }

    let reputation = await UserReputation.findOne({ userId });
    if (!reputation) {
      reputation = await UserReputation.create({
        userId,
        walletAddress: req.body.walletAddress || 'unknown'
      });
    }

    // Add reputation points
    await reputation.addReputationPoints(points, category, action, eventDetails);

    // Update expertise if relevant
    if (eventDetails.expertiseCategory) {
      await reputation.updateExpertise(eventDetails.expertiseCategory, points);
    }

    // Check for level up
    const previousLevel = reputation.reputationLevel;
    const newLevel = reputation.reputationLevel;
    const leveledUp = previousLevel !== newLevel;

    // Broadcast reputation update
    if (eventDetails.venueId) {
      websocketService.broadcastToVenue(eventDetails.venueId, {
        type: 'REPUTATION_UPDATE',
        userId,
        action,
        points,
        newScore: reputation.overallScore,
        leveledUp,
        newLevel,
        message: leveledUp 
          ? `User leveled up to ${newLevel}!` 
          : `User gained ${points} reputation points!`
      });
    }

    res.status(200).json({
      message: 'Reputation updated successfully',
      reputation: {
        overallScore: reputation.overallScore,
        reputationLevel: reputation.reputationLevel,
        categoryScore: reputation.categories[category]?.score,
        leveledUp,
        newAchievements: reputation.checkAchievements()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify taste prediction accuracy
 */
async function verifyTastePrediction(req, res, next) {
  try {
    const { 
      userId, 
      predictionId, 
      actualOutcome, 
      predictionType = 'content' 
    } = req.body;

    if (!userId || !predictionId || actualOutcome === undefined) {
      return res.status(400).json({ 
        message: 'User ID, prediction ID, and actual outcome are required' 
      });
    }

    let reputation = await UserReputation.findOne({ userId });
    if (!reputation) {
      return res.status(404).json({ message: 'User reputation not found' });
    }

    // Update taste metrics based on prediction accuracy
    const isCorrect = actualOutcome === true; // Simplified - actual logic would be more complex
    
    if (predictionType === 'content') {
      reputation.tasteMetrics.contentPredictions.total += 1;
      if (isCorrect) {
        reputation.tasteMetrics.contentPredictions.correct += 1;
      }
      reputation.tasteMetrics.contentPredictions.accuracy = 
        (reputation.tasteMetrics.contentPredictions.correct / 
         reputation.tasteMetrics.contentPredictions.total) * 100;
    } else if (predictionType === 'viral') {
      reputation.tasteMetrics.viralPredictions.total += 1;
      if (isCorrect) {
        reputation.tasteMetrics.viralPredictions.correct += 1;
      }
      reputation.tasteMetrics.viralPredictions.accuracy = 
        (reputation.tasteMetrics.viralPredictions.correct / 
         reputation.tasteMetrics.viralPredictions.total) * 100;
    }

    // Award points for correct predictions
    if (isCorrect) {
      const points = predictionType === 'viral' ? 15 : 10;
      await reputation.addReputationPoints(points, 'curator', 'correct_prediction', {
        predictionId,
        predictionType
      });
    }

    await reputation.save();

    res.status(200).json({
      message: 'Taste prediction verified successfully',
      isCorrect,
      tasteMetrics: reputation.tasteMetrics,
      newScore: reputation.overallScore
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get reputation marketplace access
 */
async function getMarketplaceAccess(req, res, next) {
  try {
    const { userId } = req.params;

    const reputation = await UserReputation.findOne({ userId })
      .populate('marketplaceAccess.exclusiveEvents', 'name startTime venue');

    if (!reputation) {
      return res.status(404).json({ message: 'User reputation not found' });
    }

    // Calculate tier based on overall score
    let tier = 'Bronze';
    if (reputation.overallScore >= 800) tier = 'Diamond';
    else if (reputation.overallScore >= 600) tier = 'Platinum';
    else if (reputation.overallScore >= 400) tier = 'Gold';
    else if (reputation.overallScore >= 200) tier = 'Silver';

    // Update tier if changed
    if (reputation.marketplaceAccess.tier !== tier) {
      reputation.marketplaceAccess.tier = tier;
      await reputation.save();
    }

    // Get tier benefits
    const tierBenefits = getTierBenefits(tier);

    res.status(200).json({
      message: 'Marketplace access retrieved successfully',
      access: {
        tier,
        benefits: tierBenefits,
        exclusiveEvents: reputation.marketplaceAccess.exclusiveEvents,
        earlyAccess: reputation.marketplaceAccess.earlyAccess,
        specialPerks: reputation.marketplaceAccess.specialPerks
      },
      reputation: {
        overallScore: reputation.overallScore,
        reputationLevel: reputation.reputationLevel
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's reputation analytics
 */
async function getReputationAnalytics(req, res, next) {
  try {
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;

    const reputation = await UserReputation.findOne({ userId });
    if (!reputation) {
      return res.status(404).json({ message: 'User reputation not found' });
    }

    // Calculate timeframe filter
    const timeframeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };

    const cutoffDate = new Date(Date.now() - (timeframeMs[timeframe] || timeframeMs['30d']));

    // Filter history by timeframe
    const recentHistory = reputation.history.filter(
      entry => entry.date >= cutoffDate
    );

    // Calculate analytics
    const analytics = {
      totalPoints: recentHistory.reduce((sum, entry) => sum + entry.points, 0),
      activityCount: recentHistory.length,
      categoryBreakdown: {},
      actionBreakdown: {},
      trendData: [],
      achievements: reputation.achievements.filter(
        achievement => achievement.unlockedAt >= cutoffDate
      )
    };

    // Category breakdown
    recentHistory.forEach(entry => {
      analytics.categoryBreakdown[entry.category] = 
        (analytics.categoryBreakdown[entry.category] || 0) + entry.points;
      analytics.actionBreakdown[entry.action] = 
        (analytics.actionBreakdown[entry.action] || 0) + 1;
    });

    // Trend data (daily points for the timeframe)
    const days = Math.ceil((Date.now() - cutoffDate.getTime()) / (24 * 60 * 60 * 1000));
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(cutoffDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayPoints = recentHistory
        .filter(entry => entry.date >= dayStart && entry.date < dayEnd)
        .reduce((sum, entry) => sum + entry.points, 0);
      
      analytics.trendData.push({
        date: dayStart.toISOString().split('T')[0],
        points: dayPoints
      });
    }

    res.status(200).json({
      message: 'Reputation analytics retrieved successfully',
      analytics,
      timeframe,
      currentReputation: {
        overallScore: reputation.overallScore,
        reputationLevel: reputation.reputationLevel,
        categories: reputation.categories
      }
    });
  } catch (error) {
    next(error);
  }
}

// Helper Functions

/**
 * Mint presence NFT (placeholder for actual blockchain integration)
 */
async function mintPresenceNFT(data) {
  // This would integrate with actual NFT minting service
  // For now, return mock data
  return {
    tokenId: `POA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contractAddress: '0x1234567890123456789012345678901234567890',
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
  };
}

/**
 * Get tier benefits based on reputation tier
 */
function getTierBenefits(tier) {
  const benefits = {
    Bronze: [
      'Basic event access',
      'Standard support'
    ],
    Silver: [
      'Priority event notifications',
      'Enhanced profile features',
      '5% discount on tips'
    ],
    Gold: [
      'Early access to exclusive events',
      'VIP support',
      '10% discount on tips',
      'Custom profile themes'
    ],
    Platinum: [
      'Exclusive event invitations',
      'Backstage access opportunities',
      '15% discount on tips',
      'Priority customer support',
      'Beta feature access'
    ],
    Diamond: [
      'All Platinum benefits',
      'Personal event concierge',
      '20% discount on tips',
      'Exclusive Diamond-only events',
      'Direct line to venue managers',
      'Custom NFT profile badges'
    ]
  };

  return benefits[tier] || benefits.Bronze;
}

module.exports = {
  getUserReputation,
  getReputationLeaderboard,
  recordProofOfPresence,
  updateReputationScore,
  verifyTastePrediction,
  getMarketplaceAccess,
  getReputationAnalytics
};