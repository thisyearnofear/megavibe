const ContentPool = require("../models/contentPoolModel.cjs");
const AudioSnippet = require("../models/snippetModel.cjs");
const websocketService = require("../services/websocket.cjs");

async function createContentPool(req, res, next) {
  try {
    const {
      name,
      description,
      venueId,
      eventId,
      contributionFee,
      isPremium,
      qualityThreshold,
    } = req.body;
    const creatorId = req.user ? req.user._id : null; // Assuming user is authenticated and user object is attached to request

    if (!creatorId) {
      return res
        .status(401)
        .json({ message: "Authentication required to create a content pool" });
    }

    const contentPool = await ContentPool.create({
      name,
      description,
      venueId,
      eventId,
      creatorId,
      contributionFee: contributionFee || 0.1,
      isPremium: isPremium || false,
      qualityThreshold: qualityThreshold || 0,
    });

    // Broadcast the new content pool to the relevant venue if applicable
    if (venueId) {
      websocketService.broadcastToVenue(venueId, {
        type: "NEW_CONTENT_POOL",
        poolId: contentPool._id,
        name: contentPool.name,
        message: `A new content pool "${contentPool.name}" has been created!`,
      });
    }

    res
      .status(201)
      .json({ message: "Content pool created successfully", contentPool });
  } catch (error) {
    next(error);
  }
}

async function getContentPools(req, res, next) {
  try {
    const {
      venueId,
      eventId,
      status = "active",
      limit = 10,
      page = 1,
    } = req.query;
    let query = { status };

    if (venueId) {
      query.venueId = venueId;
    }
    if (eventId) {
      query.eventId = eventId;
    }

    const skip = (page - 1) * limit;
    const contentPools = await ContentPool.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await ContentPool.countDocuments(query);

    res.status(200).json({
      contentPools,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function contributeToPool(req, res, next) {
  try {
    const { poolId, snippetId } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required to contribute to a content pool",
      });
    }

    const contentPool = await ContentPool.findById(poolId);
    if (!contentPool) {
      return res.status(404).json({ message: "Content pool not found" });
    }

    if (contentPool.status !== "active") {
      return res.status(400).json({ message: "Content pool is not active" });
    }

    const snippet = await AudioSnippet.findById(snippetId);
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    if (snippet.creator.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this snippet" });
    }

    // Check if snippet meets quality threshold for premium pools
    if (contentPool.isPremium && contentPool.qualityThreshold > 0) {
      const engagementRate = snippet.engagementRate || 0;
      if (engagementRate < contentPool.qualityThreshold) {
        return res.status(400).json({
          message:
            "Snippet does not meet the quality threshold for this premium pool",
        });
      }
    }

    // Simulate payment of contribution fee (in a real system, integrate with payment or blockchain service)
    // For now, assume payment is successful
    const contributionFee = contentPool.contributionFee;

    // Add snippet to pool
    const added = await contentPool.addSnippet(snippetId);
    if (!added) {
      return res.status(400).json({ message: "Snippet already in pool" });
    }

    // Update snippet to reflect pool membership
    snippet.monetization.isInPool = true;
    snippet.monetization.poolId = poolId;
    snippet.monetization.poolContributionFee = contributionFee;
    await snippet.save();

    // Update pool contribution stats
    contentPool.totalContributions += contributionFee;
    await contentPool.save();

    // Broadcast contribution to venue if applicable
    if (contentPool.venueId) {
      websocketService.broadcastToVenue(contentPool.venueId, {
        type: "NEW_POOL_CONTRIBUTION",
        poolId: contentPool._id,
        snippetId: snippetId,
        message: `A new snippet has been contributed to "${contentPool.name}" pool!`,
      });
    }

    res.status(200).json({
      message: "Snippet contributed to pool successfully",
      contentPool,
      snippet,
    });
  } catch (error) {
    next(error);
  }
}

async function trackSnippetUsage(req, res, next) {
  try {
    const { snippetId } = req.body;

    const snippet = await AudioSnippet.findById(snippetId);
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    if (!snippet.monetization.isInPool || !snippet.monetization.poolId) {
      return res
        .status(400)
        .json({ message: "Snippet is not part of any content pool" });
    }

    // Increment usage count
    snippet.monetization.usageCount += 1;
    await snippet.save();

    // Calculate payout (placeholder logic; adjust based on actual business rules)
    const payoutPerUse = snippet.monetization.payoutPerUse || 0.01; // Example rate per use
    snippet.monetization.earnings += payoutPerUse;
    await snippet.save();

    // Distribute earnings to pool if applicable
    const pool = await ContentPool.findById(snippet.monetization.poolId);
    if (pool) {
      await pool.distributeEarnings(payoutPerUse);
    }

    res
      .status(200)
      .json({ message: "Snippet usage tracked successfully", snippet });
  } catch (error) {
    next(error);
  }
}

async function voteForSnippetInPool(req, res, next) {
  try {
    const { poolId, snippetId, vote } = req.body; // vote should be 'for' or 'against'
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required to vote on snippets" });
    }

    const contentPool = await ContentPool.findById(poolId);
    if (!contentPool) {
      return res.status(404).json({ message: "Content pool not found" });
    }

    if (contentPool.status !== "active") {
      return res
        .status(400)
        .json({ message: "Content pool is not active for voting" });
    }

    const snippet = await AudioSnippet.findById(snippetId);
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    if (
      !snippet.monetization.isInPool ||
      snippet.monetization.poolId.toString() !== poolId.toString()
    ) {
      return res
        .status(400)
        .json({ message: "Snippet is not part of this content pool" });
    }

    // Initialize voting fields if they don't exist
    if (!snippet.votes) {
      snippet.votes = { votesFor: 0, votesAgainst: 0, votedBy: [] };
    }

    // Check if user has already voted
    const hasVoted = snippet.votes.votedBy.some(
      (voter) => voter.toString() === userId.toString()
    );
    if (hasVoted) {
      return res
        .status(400)
        .json({ message: "You have already voted on this snippet" });
    }

    // Record the vote
    if (vote === "for") {
      snippet.votes.votesFor += 1;
    } else if (vote === "against") {
      snippet.votes.votesAgainst += 1;
    } else {
      return res.status(400).json({ message: "Invalid vote value" });
    }

    snippet.votes.votedBy.push(userId);
    await snippet.save();

    // Check if snippet meets quality threshold for premium pool entry (if applicable)
    if (contentPool.isPremium && contentPool.qualityThreshold > 0) {
      const totalVotes = snippet.votes.votesFor + snippet.votes.votesAgainst;
      const approvalRate =
        totalVotes > 0 ? snippet.votes.votesFor / totalVotes : 0;
      if (approvalRate >= 0.7 && totalVotes >= 10) {
        // Example threshold: 70% approval with at least 10 votes
        snippet.isVerified = true; // Mark as verified for premium content
        await snippet.save();

        // Notify venue of verified premium content
        if (contentPool.venueId) {
          websocketService.broadcastToVenue(contentPool.venueId, {
            type: "PREMIUM_SNIPPET_VERIFIED",
            poolId: contentPool._id,
            snippetId: snippetId,
            message: `Snippet verified for premium pool "${contentPool.name}" by community vote!`,
          });
        }
      }
    }

    // Broadcast voting update to venue if applicable
    if (contentPool.venueId) {
      websocketService.broadcastToVenue(contentPool.venueId, {
        type: "SNIPPET_VOTE_UPDATE",
        poolId: contentPool._id,
        snippetId: snippetId,
        votesFor: snippet.votes.votesFor,
        votesAgainst: snippet.votes.votesAgainst,
        message: `Community vote updated for snippet in "${contentPool.name}" pool.`,
      });
    }

    res.status(200).json({ message: "Vote recorded successfully", snippet });
  } catch (error) {
    next(error);
  }
}

async function trackViralRevenue(req, res, next) {
  try {
    const { poolId, snippetId } = req.body;

    const contentPool = await ContentPool.findById(poolId);
    if (!contentPool) {
      return res.status(404).json({ message: "Content pool not found" });
    }

    const snippet = await AudioSnippet.findById(snippetId);
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    if (
      !snippet.monetization.isInPool ||
      snippet.monetization.poolId.toString() !== poolId.toString()
    ) {
      return res
        .status(400)
        .json({ message: "Snippet is not part of this content pool" });
    }

    // Check if snippet meets viral criteria (example: based on shares and plays)
    const viralThresholdShares = 100; // Example threshold for shares
    const viralThresholdPlays = 1000; // Example threshold for plays
    if (
      snippet.stats.shares >= viralThresholdShares &&
      snippet.stats.plays >= viralThresholdPlays
    ) {
      // Mark as viral if not already marked
      if (!snippet.monetization.isViral) {
        snippet.monetization.isViral = true;
        await snippet.save();

        // Notify venue of viral content
        if (contentPool.venueId) {
          websocketService.broadcastToVenue(contentPool.venueId, {
            type: "VIRAL_SNIPPET_DETECTED",
            poolId: contentPool._id,
            snippetId: snippetId,
            message: `Snippet in "${contentPool.name}" pool has gone viral with ${snippet.stats.shares} shares and ${snippet.stats.plays} plays!`,
          });
        }
      }

      // Calculate viral revenue share (example logic)
      const viralRevenuePerShare = 0.005; // Example rate per share
      const totalShares = snippet.stats.shares;
      const viralRevenue = totalShares * viralRevenuePerShare;

      // Distribute viral revenue to contributors in the pool
      const contributors = await AudioSnippet.find({
        "monetization.poolId": poolId,
        "monetization.isInPool": true,
      });

      if (contributors.length > 0) {
        const revenuePerContributor = viralRevenue / contributors.length;
        for (const contributorSnippet of contributors) {
          contributorSnippet.monetization.earnings += revenuePerContributor;
          await contributorSnippet.save();
        }

        // Update pool stats
        contentPool.totalViralRevenue += viralRevenue;
        await contentPool.save();

        // Notify venue of revenue distribution
        if (contentPool.venueId) {
          websocketService.broadcastToVenue(contentPool.venueId, {
            type: "VIRAL_REVENUE_DISTRIBUTED",
            poolId: contentPool._id,
            amount: viralRevenue,
            contributors: contributors.length,
            message: `Viral revenue of $${viralRevenue.toFixed(
              2
            )} distributed to ${contributors.length} contributors in "${
              contentPool.name
            }" pool.`,
          });
        }
      }
    }

    res.status(200).json({
      message: "Viral revenue tracking completed",
      snippet,
      viralStatus: snippet.monetization.isViral || false,
    });
  } catch (error) {
    next(error);
  }
}

async function groupSnippetsByPerspective(req, res, next) {
  try {
    const { poolId, momentId, eventId, limit = 10 } = req.query;

    const contentPool = await ContentPool.findById(poolId);
    if (!contentPool) {
      return res.status(404).json({ message: "Content pool not found" });
    }

    if (contentPool.status !== "active") {
      return res.status(400).json({ message: "Content pool is not active" });
    }

    // Build query to find snippets in the pool grouped by moment or event perspective
    let query = {
      "monetization.isInPool": true,
      "monetization.poolId": poolId,
    };

    if (momentId) {
      query._id = momentId; // If a specific moment/snippet ID is provided
    } else if (eventId) {
      query.event = eventId; // Group by event if eventId is provided
    } else if (contentPool.eventId) {
      query.event = contentPool.eventId; // Default to pool's event if available
    } else if (contentPool.venueId) {
      query.venue = contentPool.venueId; // Otherwise default to pool's venue
    }

    // Find snippets matching the query
    const snippets = await AudioSnippet.find(query)
      .sort({ recordedAt: 1, "stats.plays": -1 }) // Sort by recording time and popularity
      .limit(parseInt(limit));

    if (!snippets || snippets.length === 0) {
      return res
        .status(404)
        .json({ message: "No snippets found for this perspective" });
    }

    // Group snippets by a "moment" identifier (e.g., close timestamps or event)
    const groupedPerspectives = {};
    snippets.forEach((snippet) => {
      // Use event ID or a derived moment identifier (e.g., rounded timestamp)
      let momentKey = snippet.event
        ? snippet.event.toString()
        : snippet.venue
        ? snippet.venue.toString() +
          "_" +
          Math.floor(snippet.recordedAt.getTime() / 60000) // Group by minute if no event
        : "unknown";

      if (!groupedPerspectives[momentKey]) {
        groupedPerspectives[momentKey] = {
          momentId: momentKey,
          eventId: snippet.event || null,
          venueId: snippet.venue || null,
          timestamp: snippet.recordedAt,
          snippets: [],
          totalPlays: 0,
          totalShares: 0,
          totalLikes: 0,
        };
      }

      groupedPerspectives[momentKey].snippets.push(snippet);
      groupedPerspectives[momentKey].totalPlays += snippet.stats.plays;
      groupedPerspectives[momentKey].totalShares += snippet.stats.shares;
      groupedPerspectives[momentKey].totalLikes += snippet.stats.likes;
    });

    // Convert grouped perspectives to array for response
    const perspectives = Object.values(groupedPerspectives).sort(
      (a, b) => b.totalPlays - a.totalPlays
    );

    // Broadcast perspective view update if applicable
    if (contentPool.venueId) {
      websocketService.broadcastToVenue(contentPool.venueId, {
        type: "PERSPECTIVE_VIEW_UPDATE",
        poolId: contentPool._id,
        perspectivesCount: perspectives.length,
        message: `Multiple perspectives viewed for moments in "${contentPool.name}" pool.`,
      });
    }

    res.status(200).json({
      message: "Snippets grouped by perspective successfully",
      perspectives,
    });
  } catch (error) {
    next(error);
  }
}

async function mintSnippetAsNFT(req, res, next) {
  try {
    const { poolId, snippetId } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required to mint NFT" });
    }

    const contentPool = await ContentPool.findById(poolId);
    if (!contentPool) {
      return res.status(404).json({ message: "Content pool not found" });
    }

    const snippet = await AudioSnippet.findById(snippetId);
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    if (
      !snippet.monetization.isInPool ||
      snippet.monetization.poolId.toString() !== poolId.toString()
    ) {
      return res
        .status(400)
        .json({ message: "Snippet is not part of this content pool" });
    }

    if (snippet.creator.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this snippet" });
    }

    if (snippet.monetization.isNFT) {
      return res
        .status(400)
        .json({ message: "Snippet has already been minted as an NFT" });
    }

    // Check if snippet meets criteria for NFT minting (e.g., popularity or viral status)
    const nftThresholdPlays = 5000; // Example threshold for plays
    const nftThresholdShares = 500; // Example threshold for shares
    if (
      snippet.stats.plays < nftThresholdPlays &&
      snippet.stats.shares < nftThresholdShares &&
      !snippet.monetization.isViral
    ) {
      return res.status(400).json({
        message:
          "Snippet does not meet the popularity criteria for NFT minting",
      });
    }

    // Simulate NFT minting process (in a real system, integrate with blockchain service)
    // For now, assume minting is successful and assign placeholder values
    snippet.monetization.isNFT = true;
    snippet.monetization.nftTokenId = `TOKEN_${Math.floor(
      Math.random() * 1000000
    )}`; // Placeholder token ID
    snippet.monetization.nftContractAddress = "0xPlaceholderContractAddress"; // Placeholder contract address
    snippet.monetization.nftOwner = "0xPlaceholderOwnerAddress"; // Placeholder owner address
    await snippet.save();

    // Update pool stats for NFT minting
    contentPool.totalNFTsMinted += 1;
    await contentPool.save();

    // Notify venue of NFT minting
    if (contentPool.venueId) {
      websocketService.broadcastToVenue(contentPool.venueId, {
        type: "NFT_MINTED",
        poolId: contentPool._id,
        snippetId: snippetId,
        tokenId: snippet.monetization.nftTokenId,
        message: `Snippet in "${contentPool.name}" pool has been minted as an NFT with token ID ${snippet.monetization.nftTokenId}!`,
      });
    }

    res.status(200).json({
      message: "Snippet successfully minted as NFT",
      snippet,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createContentPool,
  getContentPools,
  contributeToPool,
  trackSnippetUsage,
  voteForSnippetInPool,
  trackViralRevenue,
  groupSnippetsByPerspective,
  mintSnippetAsNFT,
};
