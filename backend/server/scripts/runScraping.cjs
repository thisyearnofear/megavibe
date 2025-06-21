#!/usr/bin/env node

/**
 * Manual scraping script
 * Run with: npm run scrape
 */

require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const EventScrapingOrchestrator = require("../services/scraping/EventScrapingOrchestrator.cjs");

async function runScraping() {
  console.log("🚀 Starting manual event scraping...");

  try {
    // Connect to MongoDB
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is required");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Initialize orchestrator
    const orchestrator = new EventScrapingOrchestrator();

    // Setup event listeners for detailed logging
    orchestrator.on("scrapingStarted", (data) => {
      console.log(`🎬 Scraping job started: ${data.jobId}`);
    });

    orchestrator.on("scrapingCompleted", (data) => {
      console.log(`🎉 Scraping completed successfully!`);
      console.log(`📊 Results:`);
      console.log(`   - Events found: ${data.eventsFound}`);
      console.log(`   - Events saved: ${data.eventsSaved}`);
      console.log(`   - Duration: ${Math.round(data.duration / 1000)}s`);
    });

    orchestrator.on("scrapingFailed", (data) => {
      console.error(`❌ Scraping failed: ${data.error}`);
    });

    orchestrator.on("serviceError", (data) => {
      console.warn(`⚠️  Service error (${data.service}): ${data.error}`);
    });

    orchestrator.on("serviceRetry", (data) => {
      console.log(`🔄 Retrying ${data.service} (attempt ${data.attempt})`);
    });

    orchestrator.on("serviceRateLimited", (data) => {
      console.log(
        `⏱️  Rate limited ${data.service}, waiting ${data.waitTime}ms`
      );
    });

    // Run the scraping
    const results = await orchestrator.runFullScraping();

    console.log("\n📈 Final Statistics:");
    console.log(`   - Web events: ${results.webEvents.length}`);
    console.log(`   - Social events: ${results.socialEvents.length}`);
    console.log(`   - Total saved: ${results.saved}`);
    console.log(`   - Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      results.errors.forEach((error, index) => {
        console.log(
          `   ${index + 1}. ${error.source} (${error.type}): ${error.error}`
        );
      });
    }

    // Show service statistics
    const status = orchestrator.getStatus();
    console.log("\n🔧 Service Statistics:");
    console.log("   Firecrawl:", {
      requests: status.services.firecrawl.requests,
      successes: status.services.firecrawl.successes,
      failures: status.services.firecrawl.failures,
      successRate: `${status.services.firecrawl.successRate.toFixed(1)}%`,
    });
    console.log("   Masa:", {
      requests: status.services.masa.requests,
      successes: status.services.masa.successes,
      failures: status.services.masa.failures,
      successRate: `${status.services.masa.successRate.toFixed(1)}%`,
    });
  } catch (error) {
    console.error("💥 Fatal error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  await mongoose.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  runScraping().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = runScraping;
