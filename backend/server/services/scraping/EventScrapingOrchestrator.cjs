/**
 * Event Scraping Orchestrator
 * Coordinates multiple scraping services and manages the overall scraping process
 */

const EventEmitter = require("events");
const cron = require("node-cron");
const FirecrawlService = require("./FirecrawlService.cjs");
const MasaService = require("./MasaService.cjs");
const { SCRAPING_SOURCES, SCRAPING_CONFIG } = require("./ScrapingConfig.cjs");

// Import models
const Event = require("../../models/eventModel.cjs");
const Venue = require("../../models/venueModel.cjs");

class EventScrapingOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = { ...SCRAPING_CONFIG, ...options };
    this.isRunning = false;
    this.currentJob = null;

    // Initialize services
    this.firecrawlService = new FirecrawlService();
    this.masaService = new MasaService();

    // Setup event listeners
    this.setupEventListeners();

    // Setup scheduled scraping
    this.setupScheduledScraping();

    this.stats = {
      totalRuns: 0,
      lastRun: null,
      eventsFound: 0,
      eventsCreated: 0,
      errors: 0,
    };
  }

  /**
   * Setup event listeners for all services
   */
  setupEventListeners() {
    const services = [this.firecrawlService, this.masaService];

    services.forEach((service) => {
      service.on("error", (error) => {
        this.emit("serviceError", { service: service.name, ...error });
      });

      service.on("retry", (retryInfo) => {
        this.emit("serviceRetry", { service: service.name, ...retryInfo });
      });

      service.on("rateLimited", (limitInfo) => {
        this.emit("serviceRateLimited", {
          service: service.name,
          ...limitInfo,
        });
      });
    });
  }

  /**
   * Setup scheduled scraping using cron
   */
  setupScheduledScraping() {
    if (
      !process.env.SCRAPING_ENABLED ||
      process.env.SCRAPING_ENABLED !== "true"
    ) {
      console.log("📊 Scheduled scraping is disabled");
      return;
    }

    const schedule = process.env.SCRAPING_SCHEDULE || "0 0 1 * *"; // Monthly by default

    cron.schedule(schedule, async () => {
      console.log("🕐 Starting scheduled event scraping...");
      try {
        await this.runFullScraping();
      } catch (error) {
        console.error("❌ Scheduled scraping failed:", error);
        this.emit("scheduledScrapingError", error);
      }
    });

    console.log(`📅 Scheduled scraping enabled: ${schedule}`);
  }

  /**
   * Run full scraping process
   */
  async runFullScraping() {
    if (this.isRunning) {
      throw new Error("Scraping is already running");
    }

    this.isRunning = true;
    this.currentJob = {
      id: `scraping_${Date.now()}`,
      startTime: new Date(),
      status: "running",
      progress: 0,
      results: {
        webEvents: [],
        socialEvents: [],
        errors: [],
      },
    };

    try {
      this.emit("scrapingStarted", { jobId: this.currentJob.id });

      // Step 1: Scrape web sources
      console.log("🌐 Scraping web sources...");
      const webEvents = await this.scrapeWebSources();
      this.currentJob.results.webEvents = webEvents;
      this.currentJob.progress = 50;

      // Step 2: Skip social sources for now
      console.log("📱 Skipping social sources (disabled)...");
      const socialEvents = [];
      this.currentJob.results.socialEvents = socialEvents;
      this.currentJob.progress = 80;

      // Step 3: Process and save events
      console.log("💾 Processing and saving events...");
      const allEvents = [...webEvents, ...socialEvents];
      const savedEvents = await this.processAndSaveEvents(allEvents);
      this.currentJob.progress = 100;

      // Update stats
      this.stats.totalRuns++;
      this.stats.lastRun = new Date();
      this.stats.eventsFound += allEvents.length;
      this.stats.eventsCreated += savedEvents.length;

      this.currentJob.status = "completed";
      this.currentJob.endTime = new Date();
      this.currentJob.results.saved = savedEvents.length;

      this.emit("scrapingCompleted", {
        jobId: this.currentJob.id,
        eventsFound: allEvents.length,
        eventsSaved: savedEvents.length,
        duration: this.currentJob.endTime - this.currentJob.startTime,
      });

      console.log(`✅ Scraping completed: ${savedEvents.length} events saved`);
      return this.currentJob.results;
    } catch (error) {
      this.stats.errors++;
      this.currentJob.status = "failed";
      this.currentJob.error = error.message;
      this.currentJob.endTime = new Date();

      this.emit("scrapingFailed", {
        jobId: this.currentJob.id,
        error: error.message,
      });

      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Scrape web sources using Firecrawl
   */
  async scrapeWebSources() {
    const webEvents = [];
    const webSources = SCRAPING_SOURCES.WEB3_EVENTS;

    for (const source of webSources) {
      try {
        console.log(`🔍 Scraping ${source.name}...`);

        const scrapedData = await this.firecrawlService.scrape(source.url, {
          includeTags: Object.values(source.selectors).flat(),
          excludeTags: ["nav", "footer", "ads", "script"],
        });

        const events = await this.firecrawlService.parseEventData(
          scrapedData,
          source
        );
        webEvents.push(...events);

        console.log(`✅ ${source.name}: Found ${events.length} events`);

        // Rate limiting between sources
        await this.sleep(2000);
      } catch (error) {
        console.error(`❌ Error scraping ${source.name}:`, error.message);
        this.currentJob.results.errors.push({
          source: source.name,
          type: "web",
          error: error.message,
        });
      }
    }

    return webEvents;
  }

  /**
   * Scrape social sources using Masa
   */
  async scrapeSocialSources() {
    const socialEvents = [];
    const socialSources = SCRAPING_SOURCES.SOCIAL_SOURCES;

    for (const source of socialSources) {
      try {
        console.log(`📱 Scraping ${source.name}...`);

        if (source.platform === "twitter") {
          const events = await this.masaService.searchTwitterEvents(
            source.queries,
            {
              maxResults: 100,
              dateRange: "since:2024-01-01 until:2025-12-31",
            }
          );

          socialEvents.push(...events);
          console.log(`✅ ${source.name}: Found ${events.length} events`);
        }

        // Rate limiting between sources
        await this.sleep(3000);
      } catch (error) {
        console.error(`❌ Error scraping ${source.name}:`, error.message);
        this.currentJob.results.errors.push({
          source: source.name,
          type: "social",
          error: error.message,
        });
      }
    }

    return socialEvents;
  }

  /**
   * Process and save events to database
   */
  async processAndSaveEvents(events) {
    const savedEvents = [];
    const duplicateEvents = [];

    for (const eventData of events) {
      try {
        // Check for duplicates
        const existing = await this.findDuplicateEvent(eventData);
        if (existing) {
          duplicateEvents.push(eventData);
          continue;
        }

        // Create or find venue
        const venue = await this.createOrFindVenue(eventData);

        // Create event
        const event = await this.createEvent(eventData, venue);
        savedEvents.push(event);
      } catch (error) {
        console.error(
          `❌ Error saving event "${eventData.name}":`,
          error.message
        );
        this.currentJob.results.errors.push({
          event: eventData.name,
          type: "database",
          error: error.message,
        });
      }
    }

    console.log(
      `📊 Processed ${events.length} events: ${savedEvents.length} saved, ${duplicateEvents.length} duplicates`
    );
    return savedEvents;
  }

  /**
   * Find duplicate events in database
   */
  async findDuplicateEvent(eventData) {
    const similarityThreshold = 0.8;

    // Check by name and date
    if (eventData.date) {
      const dateRange = {
        $gte: new Date(eventData.date.getTime() - 24 * 60 * 60 * 1000), // 1 day before
        $lte: new Date(eventData.date.getTime() + 24 * 60 * 60 * 1000), // 1 day after
      };

      const existing = await Event.findOne({
        name: new RegExp(eventData.name.substring(0, 20), "i"),
        startTime: dateRange,
      });

      if (existing) return existing;
    }

    // Check by name similarity
    const existing = await Event.findOne({
      name: new RegExp(eventData.name.substring(0, 15), "i"),
    });

    return existing;
  }

  /**
   * Create or find venue for event
   */
  async createOrFindVenue(eventData) {
    if (!eventData.location) {
      // Return default venue for online events
      return await this.getDefaultVenue();
    }

    const locationStr =
      typeof eventData.location === "string"
        ? eventData.location
        : eventData.location.full;

    // Try to find existing venue
    let venue = await Venue.findOne({
      $or: [
        { name: new RegExp(locationStr, "i") },
        { address: new RegExp(locationStr, "i") },
      ],
    });

    if (!venue) {
      // Create new venue
      venue = new Venue({
        name: locationStr,
        address: locationStr,
        description: `Venue for ${eventData.name}`,
        location: {
          type: "Point",
          coordinates: [0, 0], // Default coordinates
        },
        capacity: 1000,
        amenities: ["WiFi", "Streaming"],
        isActive: true,
        contactInfo: {
          email: "info@venue.com",
          phone: "+1-555-0000",
        },
        ratings: {
          overall: 4.0,
          sound: 4.0,
          atmosphere: 4.0,
          service: 4.0,
          totalReviews: 1,
        },
        verificationStatus: "pending",
        preferredGenres: ["conference", "tech"],
        commissionRate: 0.1,
        source: "scraped",
      });

      await venue.save();
    }

    return venue;
  }

  /**
   * Get default venue for online events
   */
  async getDefaultVenue() {
    let venue = await Venue.findOne({ name: "Online Event" });

    if (!venue) {
      venue = new Venue({
        name: "Online Event",
        address: "Virtual",
        description: "Virtual venue for online events",
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
        capacity: 10000,
        amenities: ["Streaming", "Recording"],
        isActive: true,
        contactInfo: {
          email: "virtual@megavibe.com",
          phone: "+1-555-VIRTUAL",
        },
        ratings: {
          overall: 4.5,
          sound: 5.0,
          atmosphere: 4.0,
          service: 4.5,
          totalReviews: 100,
        },
        verificationStatus: "verified",
        preferredGenres: ["conference", "virtual"],
        commissionRate: 0.05,
      });

      await venue.save();
    }

    return venue;
  }

  /**
   * Create event in database
   */
  async createEvent(eventData, venue) {
    const event = new Event({
      name: eventData.name,
      type: "other", // Default type
      venue: venue._id,
      startTime: eventData.date || new Date(),
      endTime: eventData.date
        ? new Date(eventData.date.getTime() + 8 * 60 * 60 * 1000)
        : new Date(), // 8 hours later
      artists: [], // Will be populated later
      description:
        eventData.description || `${eventData.name} - Web3 Conference`,
      ticketInfo: {
        price: 0,
        currency: "USD",
        availableTickets: venue.capacity,
        soldTickets: 0,
      },
      attendance: {
        expected: Math.floor(venue.capacity * 0.7),
        checkedIn: 0,
        peak: 0,
      },
      status:
        eventData.date && eventData.date > new Date() ? "scheduled" : "ended",
      tags: eventData.tags || ["web3", "conference"],
      metadata: {
        source: eventData.source,
        sourceUrl: eventData.sourceUrl,
        scrapedAt: eventData.scrapedAt,
        socialData: eventData.socialData,
      },
    });

    return await event.save();
  }

  /**
   * Get current scraping status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentJob: this.currentJob,
      stats: this.stats,
      services: {
        firecrawl: this.firecrawlService.getStats(),
        masa: this.masaService.getStats(),
      },
    };
  }

  /**
   * Manually trigger scraping
   */
  async triggerScraping() {
    return await this.runFullScraping();
  }

  /**
   * Stop current scraping job
   */
  stopScraping() {
    if (this.currentJob && this.currentJob.status === "running") {
      this.currentJob.status = "cancelled";
      this.currentJob.endTime = new Date();
      this.isRunning = false;

      this.emit("scrapingStopped", { jobId: this.currentJob.id });
    }
  }

  /**
   * Utility method
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = EventScrapingOrchestrator;
