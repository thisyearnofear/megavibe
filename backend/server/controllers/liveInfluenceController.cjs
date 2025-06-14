// server/controllers/liveInfluenceController.cjs
const Tip = require("../models/tipModel.cjs");
const Performance = require("../models/performanceModel.cjs");
const Venue = require("../models/venueModel.cjs");
const Event = require("../models/eventModel.cjs");
const websocketService = require("../services/websocket.cjs");

async function recordTip(req, res, next) {
  try {
    const { performanceId, amount, performanceChoice, topicRequest } = req.body;
    const userId = req.user ? req.user._id : null; // Assuming user is authenticated

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required to send a tip" });
    }

    if (!performanceId || !amount) {
      return res
        .status(400)
        .json({ message: "Performance ID and amount are required fields" });
    }

    const performance = await Performance.findById(performanceId);
    if (!performance) {
      return res.status(404).json({ message: "Performance not found" });
    }

    const tip = await Tip.create({
      userId,
      performanceId,
      amount,
      performanceChoice: performanceChoice || null,
      topicRequest: topicRequest || null,
    });

    // Update performance with tip influence
    if (performanceChoice) {
      if (!performance.influenceChoices) {
        performance.influenceChoices = {};
      }
      performance.influenceChoices[performanceChoice] =
        (performance.influenceChoices[performanceChoice] || 0) + amount;
    }
    if (topicRequest) {
      if (!performance.topicRequests) {
        performance.topicRequests = {};
      }
      performance.topicRequests[topicRequest] =
        (performance.topicRequests[topicRequest] || 0) + amount;
    }
    performance.totalTips += amount;
    await performance.save();

    // Broadcast real-time tip to venue and performers
    websocketService.broadcastToVenue(performance.venueId, {
      type: "NEW_TIP",
      performanceId: performance._id,
      amount: amount,
      performanceChoice: performanceChoice || null,
      topicRequest: topicRequest || null,
      message: `A tip of ${amount} USDC has been received for this performance!`,
    });

    res.status(201).json({ message: "Tip recorded successfully", tip });
  } catch (error) {
    next(error);
  }
}

async function getSentimentAnalytics(req, res, next) {
  try {
    const { venueId, eventId, performanceId, timeframe = "live" } = req.query;

    let query = {};
    if (venueId) query.venueId = venueId;
    if (eventId) query.eventId = eventId;
    if (performanceId) query._id = performanceId;

    const performances = await Performance.find(query);
    if (!performances || performances.length === 0) {
      return res
        .status(404)
        .json({ message: "No performances found for the given criteria" });
    }

    // Aggregate sentiment data (mock data for illustration; real implementation would use reaction data)
    const sentimentData = performances.map((perf) => {
      const reactions = perf.reactions || {
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      const totalReactions =
        reactions.positive + reactions.neutral + reactions.negative;
      const sentimentScore =
        totalReactions > 0
          ? (reactions.positive * 1 +
              reactions.neutral * 0 +
              reactions.negative * -1) /
            totalReactions
          : 0;
      return {
        performanceId: perf._id,
        title: perf.title,
        sentimentScore: sentimentScore.toFixed(2),
        totalReactions,
        positive: reactions.positive,
        neutral: reactions.neutral,
        negative: reactions.negative,
        totalTips: perf.totalTips || 0,
      };
    });

    // Broadcast live sentiment update if timeframe is 'live'
    if (timeframe === "live" && venueId) {
      websocketService.broadcastToVenue(venueId, {
        type: "SENTIMENT_ANALYTICS_UPDATE",
        sentimentData,
        message: "Live audience sentiment updated for performances.",
      });
    }

    res
      .status(200)
      .json({
        message: "Sentiment analytics retrieved successfully",
        sentimentData,
      });
  } catch (error) {
    next(error);
  }
}

async function recordSocialShare(req, res, next) {
  try {
    const { performanceId, snippetId, platform } = req.body;
    const userId = req.user ? req.user._id : null; // Assuming user is authenticated

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required to record a social share" });
    }

    if (!performanceId && !snippetId) {
      return res
        .status(400)
        .json({ message: "Performance ID or Snippet ID is required" });
    }

    // Update performance or snippet with share count
    if (performanceId) {
      const performance = await Performance.findById(performanceId);
      if (!performance) {
        return res.status(404).json({ message: "Performance not found" });
      }
      performance.socialShares = (performance.socialShares || 0) + 1;
      if (platform) {
        if (!performance.sharePlatforms) performance.sharePlatforms = {};
        performance.sharePlatforms[platform] =
          (performance.sharePlatforms[platform] || 0) + 1;
      }
      await performance.save();

      // Broadcast share incentive to venue
      websocketService.broadcastToVenue(performance.venueId, {
        type: "SOCIAL_SHARE",
        performanceId: performance._id,
        platform: platform || "unknown",
        message: `Performance shared on ${platform || "a social platform"}!`,
      });

      // Reward logic placeholder (e.g., points, tokens for sharing)
      const reward = 10; // Example reward points
      res.status(200).json({
        message: "Social share recorded successfully for performance",
        reward,
        performance,
      });
    } else if (snippetId) {
      const Snippet = require("../models/snippetModel.cjs");
      const snippet = await Snippet.findById(snippetId);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      snippet.socialShares = (snippet.socialShares || 0) + 1;
      if (platform) {
        if (!snippet.sharePlatforms) snippet.sharePlatforms = {};
        snippet.sharePlatforms[platform] =
          (snippet.sharePlatforms[platform] || 0) + 1;
      }
      await snippet.save();

      // Broadcast share incentive to venue
      const performance = await Performance.findById(snippet.performanceId);
      if (performance) {
        websocketService.broadcastToVenue(performance.venueId, {
          type: "SOCIAL_SHARE_SNIPPET",
          snippetId: snippet._id,
          platform: platform || "unknown",
          message: `Snippet shared on ${platform || "a social platform"}!`,
        });
      }

      // Reward logic placeholder (e.g., points, tokens for sharing)
      const reward = 5; // Example reward points
      res.status(200).json({
        message: "Social share recorded successfully for snippet",
        reward,
        snippet,
      });
    }
  } catch (error) {
    next(error);
  }
}

async function getPerformanceSteering(req, res, next) {
  try {
    const { performanceId } = req.params;

    const performance = await Performance.findById(performanceId);
    if (!performance) {
      return res.status(404).json({ message: "Performance not found" });
    }

    // Aggregate influence data for steering feedback
    const influenceChoices = performance.influenceChoices || {};
    const topicRequests = performance.topicRequests || {};
    const totalTips = performance.totalTips || 0;

    // Calculate top choices and topics based on tip amounts
    const topChoice =
      Object.keys(influenceChoices).length > 0
        ? Object.keys(influenceChoices).reduce(
            (a, b) => (influenceChoices[a] > influenceChoices[b] ? a : b),
            ""
          )
        : "No choices yet";
    const topTopic =
      Object.keys(topicRequests).length > 0
        ? Object.keys(topicRequests).reduce(
            (a, b) => (topicRequests[a] > topicRequests[b] ? a : b),
            ""
          )
        : "No topics requested yet";

    const steeringData = {
      performanceId: performance._id,
      title: performance.title,
      totalTips,
      topChoice: {
        name: topChoice,
        amount: influenceChoices[topChoice] || 0,
      },
      topTopic: {
        name: topTopic,
        amount: topicRequests[topTopic] || 0,
      },
      choices: influenceChoices,
      topics: topicRequests,
    };

    // Broadcast steering feedback to performers in real-time
    websocketService.broadcastToVenue(performance.venueId, {
      type: "PERFORMANCE_STEERING_UPDATE",
      steeringData,
      message: `Audience feedback for performance: Top choice is ${topChoice} with ${
        influenceChoices[topChoice] || 0
      } USDC in tips.`,
    });

    res
      .status(200)
      .json({
        message: "Performance steering data retrieved successfully",
        steeringData,
      });
  } catch (error) {
    next(error);
  }
}

async function getVenueAnalytics(req, res, next) {
  try {
    const { venueId, timeframe = "allTime" } = req.query;

    if (!venueId) {
      return res.status(400).json({ message: "Venue ID is required" });
    }

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Fetch performances for this venue
    const performances = await Performance.find({ venueId });
    if (!performances || performances.length === 0) {
      return res
        .status(404)
        .json({ message: "No performances found for this venue" });
    }

    // Aggregate analytics (mock data for some fields; real implementation would use detailed data)
    let totalTips = 0;
    let totalShares = 0;
    let totalReactions = 0;
    let topicPopularity = {};
    let engagementHeatMap = {};

    performances.forEach((perf) => {
      totalTips += perf.totalTips || 0;
      totalShares += perf.socialShares || 0;

      // Reactions aggregation
      if (perf.reactions) {
        totalReactions +=
          (perf.reactions.positive || 0) +
          (perf.reactions.neutral || 0) +
          (perf.reactions.negative || 0);
      }

      // Topic popularity (based on tips for topics)
      if (perf.topicRequests) {
        Object.keys(perf.topicRequests).forEach((topic) => {
          topicPopularity[topic] =
            (topicPopularity[topic] || 0) + perf.topicRequests[topic];
        });
      }

      // Engagement heatmap (mock data by time or section; real data would use timestamps or zones)
      const perfDate = perf.startTime || new Date();
      const hourKey = `${perfDate.getHours()}:00`;
      engagementHeatMap[hourKey] =
        (engagementHeatMap[hourKey] || 0) +
        (perf.totalTips || 0) +
        (perf.socialShares || 0);
    });

    // Sort topic popularity
    const sortedTopics = Object.keys(topicPopularity)
      .sort((a, b) => topicPopularity[b] - topicPopularity[a])
      .slice(0, 5);

    const analyticsData = {
      venueId: venue._id,
      venueName: venue.name,
      totalPerformances: performances.length,
      totalTips,
      totalShares,
      totalReactions,
      topTopics: sortedTopics.map((topic) => ({
        name: topic,
        tipAmount: topicPopularity[topic],
      })),
      engagementHeatMap: Object.keys(engagementHeatMap)
        .map((hour) => ({
          time: hour,
          engagement: engagementHeatMap[hour],
        }))
        .sort((a, b) => a.time.localeCompare(b.time)),
      sentiment: {
        averageScore:
          performances.length > 0
            ? performances.reduce((sum, perf) => {
                const reactions = perf.reactions || {
                  positive: 0,
                  neutral: 0,
                  negative: 0,
                };
                const total =
                  reactions.positive + reactions.neutral + reactions.negative;
                return (
                  sum +
                  (total > 0
                    ? (reactions.positive - reactions.negative) / total
                    : 0)
                );
              }, 0) / performances.length
            : 0,
      },
    };

    // Broadcast analytics update to venue managers in real-time
    websocketService.broadcastToVenue(venueId, {
      type: "VENUE_ANALYTICS_UPDATE",
      analyticsData,
      message: "Venue analytics updated with latest engagement data.",
    });

    res
      .status(200)
      .json({
        message: "Venue analytics retrieved successfully",
        analyticsData,
      });
  } catch (error) {
    next(error);
  }
}

async function getOrganiserToolsData(req, res, next) {
  try {
    const { venueId, eventId } = req.query;

    let query = {};
    if (venueId) query.venueId = venueId;
    if (eventId) query.eventId = eventId;

    if (!venueId && !eventId) {
      return res
        .status(400)
        .json({ message: "Venue ID or Event ID is required" });
    }

    // Fetch performances for the venue or event
    const performances = await Performance.find(query);
    if (!performances || performances.length === 0) {
      return res
        .status(404)
        .json({ message: "No performances found for the given criteria" });
    }

    // Aggregate data for organiser tools (real-time insights for event optimization)
    let totalTips = 0;
    let totalShares = 0;
    let totalReactions = 0;
    let topicPopularity = {};
    let choicePopularity = {};
    let performanceEngagement = [];

    performances.forEach((perf) => {
      totalTips += perf.totalTips || 0;
      totalShares += perf.socialShares || 0;

      // Reactions aggregation
      if (perf.reactions) {
        totalReactions +=
          (perf.reactions.positive || 0) +
          (perf.reactions.neutral || 0) +
          (perf.reactions.negative || 0);
      }

      // Topic and choice popularity based on tips
      if (perf.topicRequests) {
        Object.keys(perf.topicRequests).forEach((topic) => {
          topicPopularity[topic] =
            (topicPopularity[topic] || 0) + perf.topicRequests[topic];
        });
      }
      if (perf.influenceChoices) {
        Object.keys(perf.influenceChoices).forEach((choice) => {
          choicePopularity[choice] =
            (choicePopularity[choice] || 0) + perf.influenceChoices[choice];
        });
      }

      // Performance engagement for ranking
      performanceEngagement.push({
        performanceId: perf._id,
        title: perf.title,
        totalTips: perf.totalTips || 0,
        totalShares: perf.socialShares || 0,
        sentimentScore: perf.reactions
          ? ((perf.reactions.positive || 0) - (perf.reactions.negative || 0)) /
            ((perf.reactions.positive || 0) +
              (perf.reactions.neutral || 0) +
              (perf.reactions.negative || 0) || 1)
          : 0,
      });
    });

    // Sort by engagement (combined tips and shares for simplicity)
    performanceEngagement.sort(
      (a, b) => b.totalTips + b.totalShares - (a.totalTips + a.totalShares)
    );

    // Top topics and choices
    const topTopics = Object.keys(topicPopularity)
      .sort((a, b) => topicPopularity[b] - topicPopularity[a])
      .slice(0, 5);
    const topChoices = Object.keys(choicePopularity)
      .sort((a, b) => choicePopularity[b] - choicePopularity[a])
      .slice(0, 5);

    const organiserData = {
      totalPerformances: performances.length,
      totalTips,
      totalShares,
      totalReactions,
      topTopics: topTopics.map((topic) => ({
        name: topic,
        tipAmount: topicPopularity[topic],
      })),
      topChoices: topChoices.map((choice) => ({
        name: choice,
        tipAmount: choicePopularity[choice],
      })),
      performanceEngagement: performanceEngagement.slice(0, 10), // Top 10 performances
      recommendations: {
        nextTopic: topTopics.length > 0 ? topTopics[0] : "No data yet",
        nextChoice: topChoices.length > 0 ? topChoices[0] : "No data yet",
        highEngagementTime: "18:00 - 20:00", // Mock data; real implementation would analyze timestamps
      },
    };

    // Broadcast organiser insights to venue or event managers in real-time
    if (venueId) {
      websocketService.broadcastToVenue(venueId, {
        type: "ORGANISER_TOOLS_UPDATE",
        organiserData,
        message:
          "Organiser tools updated with real-time event data for optimization.",
      });
    } else if (eventId) {
      const event = await Event.findById(eventId);
      if (event && event.venueId) {
        websocketService.broadcastToVenue(event.venueId, {
          type: "ORGANISER_TOOLS_UPDATE",
          organiserData,
          message:
            "Organiser tools updated with real-time event data for optimization.",
        });
      }
    }

    res
      .status(200)
      .json({
        message: "Organiser tools data retrieved successfully",
        organiserData,
      });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  recordTip,
  getSentimentAnalytics,
  recordSocialShare,
  getPerformanceSteering,
  getVenueAnalytics,
  getOrganiserToolsData,
};
