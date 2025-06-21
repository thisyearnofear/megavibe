/**
 * Firecrawl scraping service implementation
 * Handles web scraping using Firecrawl API
 */

const BaseScrapingService = require("./BaseScrapingService.cjs");
const fetch = require("node-fetch");

class FirecrawlService extends BaseScrapingService {
  constructor(options = {}) {
    super("Firecrawl", options);
    this.apiKey = process.env.FIRECRAWL_API_KEY;
    this.baseUrl = "https://api.firecrawl.dev/v1";

    if (!this.apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable is required");
    }
  }

  /**
   * Scrape a single URL
   */
  async scrape(url, options = {}) {
    await this.checkRateLimit("firecrawl");

    const cacheKey = `${this.options.CACHE.keyPrefix}firecrawl:${url}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const scrapeOptions = {
      url,
      formats: ["markdown", "html"],
      onlyMainContent: true,
      includeTags: ["h1", "h2", "h3", "h4", "time", "a", "p", "div", "span"],
      excludeTags: ["nav", "footer", "header", "script", "style", "ads"],
      timeout: this.options.TIMEOUTS.scraping,
      removeBase64Images: true,
      blockAds: true,
      ...options,
    };

    const result = await this.withRetry(
      () => this.makeFirecrawlRequest("/scrape", scrapeOptions),
      { operation: "scrape", url }
    );

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Batch scrape multiple URLs
   */
  async batchScrape(urls, options = {}) {
    await this.checkRateLimit("firecrawl");

    const batchOptions = {
      urls,
      maxConcurrency: this.options.CONCURRENCY.maxConcurrent,
      ignoreInvalidURLs: true,
      formats: ["markdown"],
      onlyMainContent: true,
      includeTags: ["h1", "h2", "h3", "time", "a", "p"],
      excludeTags: ["nav", "footer", "script", "style"],
      timeout: this.options.TIMEOUTS.scraping,
      ...options,
    };

    const batchJob = await this.withRetry(
      () => this.makeFirecrawlRequest("/batch/scrape", batchOptions),
      { operation: "batchScrape", urls: urls.length }
    );

    // Poll for completion
    return await this.pollBatchJob(batchJob.id);
  }

  /**
   * Crawl a website (discover and scrape multiple pages)
   */
  async crawl(url, options = {}) {
    await this.checkRateLimit("firecrawl");

    const crawlOptions = {
      url,
      maxDepth: 2,
      limit: 50,
      allowBackwardLinks: false,
      allowExternalLinks: false,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
        includeTags: ["h1", "h2", "h3", "time", "a"],
        excludeTags: ["nav", "footer", "script"],
      },
      ...options,
    };

    const crawlJob = await this.withRetry(
      () => this.makeFirecrawlRequest("/crawl", crawlOptions),
      { operation: "crawl", url }
    );

    return await this.pollCrawlJob(crawlJob.id);
  }

  /**
   * Parse event data from scraped content
   */
  async parseEventData(scrapedData, source) {
    const events = [];

    try {
      const { markdown, html, metadata } = scrapedData.data || scrapedData;
      const selectors = source.selectors;

      // Extract events using markdown patterns
      if (markdown) {
        const markdownEvents = this.parseMarkdownEvents(markdown, source);
        events.push(...markdownEvents);
      }

      // Extract events using HTML selectors (if available)
      if (html && selectors) {
        const htmlEvents = this.parseHtmlEvents(html, selectors);
        events.push(...htmlEvents);
      }

      // Validate and clean events
      const validEvents = events
        .map((event) => this.cleanEventData(event, source))
        .filter((event) => {
          try {
            this.validateEventData(event);
            return true;
          } catch (error) {
            this.emit("validationError", { event, error: error.message });
            return false;
          }
        });

      return validEvents;
    } catch (error) {
      this.emit("parseError", { source: source.name, error: error.message });
      return [];
    }
  }

  /**
   * Parse events from markdown content
   */
  parseMarkdownEvents(markdown, source) {
    const events = [];
    const lines = markdown.split("\n");
    let currentEvent = null;

    // Enhanced patterns for better event detection
    const eventIndicators = [
      /conference|summit|meetup|event|hackathon|workshop/i,
      /\d{4}.*(?:conference|summit|event)/i,
      /(?:join us|save the date|register)/i,
    ];

    const datePatterns = [
      /(\w+\s+\d{1,2}(?:-\d{1,2})?,?\s+\d{4})/g, // "March 15-16, 2024"
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g, // "03/15/2024"
      /(\d{4}-\d{2}-\d{2})/g, // "2024-03-15"
      /(\d{1,2}\s+\w+\s+\d{4})/g, // "15 March 2024"
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and navigation
      if (!line || line.includes("nav") || line.includes("menu")) continue;

      // Detect event headers (h1, h2, h3) or lines that look like events
      const isHeader = line.match(/^#{1,3}\s+(.+)/);
      const isEventLine = eventIndicators.some((pattern) => pattern.test(line));

      if (isHeader || (isEventLine && line.length > 10 && line.length < 100)) {
        // Save previous event
        if (currentEvent && currentEvent.name && currentEvent.name.length > 3) {
          events.push(currentEvent);
        }

        const eventName = isHeader
          ? line.replace(/^#{1,3}\s+/, "").trim()
          : line.trim();

        currentEvent = {
          name: this.cleanText(eventName),
          source: source.name,
          sourceUrl: source.url,
          rawData: { line: i, originalLine: line },
        };
      }

      // Extract dates from current line or nearby lines
      if (currentEvent) {
        for (const pattern of datePatterns) {
          const dateMatch = line.match(pattern);
          if (dateMatch && !currentEvent.date) {
            try {
              currentEvent.date = this.parseDate(dateMatch[0]);
              break;
            } catch (error) {
              // Continue to next pattern
            }
          }
        }

        // Extract locations
        const locationMatch = line.match(
          /([\w\s]+,\s*[\w\s]+(?:,\s*[\w\s]+)?)/
        );
        if (locationMatch && !currentEvent.location && !line.includes("http")) {
          currentEvent.location = this.extractLocation(locationMatch[0]);
        }

        // Extract descriptions (longer lines that aren't headers)
        if (
          line.length > 30 &&
          line.length < 200 &&
          !line.startsWith("#") &&
          !line.includes("http") &&
          !currentEvent.description
        ) {
          currentEvent.description = this.cleanText(line);
        }
      }
    }

    // Add the last event
    if (currentEvent && currentEvent.name && currentEvent.name.length > 3) {
      events.push(currentEvent);
    }

    // Filter out invalid events
    return events.filter((event) => {
      // Must have a reasonable name
      if (!event.name || event.name.length < 5) return false;

      // Should contain event-related keywords
      const hasEventKeywords = eventIndicators.some(
        (pattern) =>
          pattern.test(event.name) || pattern.test(event.description || "")
      );

      return hasEventKeywords;
    });
  }

  /**
   * Parse events from HTML using selectors
   */
  parseHtmlEvents(html, selectors) {
    // This would require a DOM parser like cheerio
    // For now, return empty array - can be implemented later
    return [];
  }

  /**
   * Clean and normalize event data
   */
  cleanEventData(event, source) {
    return {
      name: this.cleanText(event.name),
      date:
        event.date instanceof Date ? event.date : this.parseDate(event.date),
      location: event.location || null,
      description: this.cleanText(event.description) || null,
      source: source.name,
      sourceUrl: source.url,
      type: "conference",
      tags: ["web3", "blockchain", "crypto"],
      scrapedAt: new Date(),
      ...event,
    };
  }

  /**
   * Make API request to Firecrawl
   */
  async makeFirecrawlRequest(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Poll batch scraping job for completion
   */
  async pollBatchJob(jobId, maxWaitTime = 300000) {
    // 5 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const response = await fetch(`${this.baseUrl}/batch/scrape/${jobId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      const result = await response.json();

      if (result.status === "completed") {
        return result;
      } else if (result.status === "failed") {
        throw new Error(`Batch job failed: ${result.error || "Unknown error"}`);
      }

      // Wait before next poll
      await this.sleep(5000);
    }

    throw new Error("Batch job timeout");
  }

  /**
   * Poll crawl job for completion
   */
  async pollCrawlJob(jobId, maxWaitTime = 600000) {
    // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const response = await fetch(`${this.baseUrl}/crawl/${jobId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      const result = await response.json();

      if (result.status === "completed") {
        return result;
      } else if (result.status === "failed") {
        throw new Error(`Crawl job failed: ${result.error || "Unknown error"}`);
      }

      // Wait before next poll
      await this.sleep(10000);
    }

    throw new Error("Crawl job timeout");
  }
}

module.exports = FirecrawlService;
