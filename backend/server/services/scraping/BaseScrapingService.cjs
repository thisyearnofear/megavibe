/**
 * Base scraping service with common functionality
 * Implements retry logic, rate limiting, and error handling
 */

const EventEmitter = require('events');
const { SCRAPING_CONFIG } = require('./ScrapingConfig.cjs');

class BaseScrapingService extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.options = { ...SCRAPING_CONFIG, ...options };
    this.rateLimiter = new Map();
    this.cache = new Map();
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      cached: 0,
      startTime: Date.now()
    };
  }

  /**
   * Rate limiting implementation
   */
  async checkRateLimit(service) {
    const now = Date.now();
    const limits = this.options.RATE_LIMITS[service];
    
    if (!limits) return true;

    const key = `${service}_${Math.floor(now / 60000)}`; // Per minute
    const current = this.rateLimiter.get(key) || 0;

    if (current >= limits.requestsPerMinute) {
      const waitTime = 60000 - (now % 60000);
      this.emit('rateLimited', { service, waitTime });
      await this.sleep(waitTime);
    }

    this.rateLimiter.set(key, current + 1);
    return true;
  }

  /**
   * Retry logic with exponential backoff
   */
  async withRetry(operation, context = {}) {
    const { maxAttempts, backoffMultiplier, initialDelay } = this.options.RETRY;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.stats.requests++;
        const result = await operation();
        this.stats.successes++;
        return result;
      } catch (error) {
        this.stats.failures++;
        
        if (attempt === maxAttempts) {
          this.emit('error', {
            operation: context.operation || 'unknown',
            error: error.message,
            attempts: attempt,
            context
          });
          throw error;
        }

        const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
        this.emit('retry', {
          attempt,
          delay,
          error: error.message,
          context
        });
        
        await this.sleep(delay);
      }
    }
  }

  /**
   * Cache management
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.options.CACHE.ttl * 1000) {
      this.stats.cached++;
      return cached.data;
    }
    return null;
  }

  setCached(key, data) {
    if (this.cache.size >= this.options.CACHE.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Data validation
   */
  validateEventData(eventData) {
    const { requiredFields, minEventNameLength, maxEventNameLength } = this.options.VALIDATION;
    
    // Check required fields
    for (const field of requiredFields) {
      if (!eventData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate event name length
    if (eventData.name) {
      const nameLength = eventData.name.length;
      if (nameLength < minEventNameLength || nameLength > maxEventNameLength) {
        throw new Error(`Event name length invalid: ${nameLength}`);
      }
    }

    // Validate date
    if (eventData.date && !this.isValidDate(eventData.date)) {
      throw new Error(`Invalid date format: ${eventData.date}`);
    }

    return true;
  }

  /**
   * Date validation and parsing
   */
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  parseDate(dateString) {
    // Try multiple date formats
    const formats = this.options.VALIDATION.dateFormats;
    
    for (const format of formats) {
      try {
        const date = new Date(dateString);
        if (this.isValidDate(date)) {
          return date;
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error(`Unable to parse date: ${dateString}`);
  }

  /**
   * Text cleaning utilities
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-.,!?()]/g, '') // Remove special chars
      .trim();
  }

  extractLocation(text) {
    if (!text) return null;
    
    // Common location patterns
    const patterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // City, Country
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2,3})/g, // City, State/Code
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          full: match[0],
          city: match[1],
          region: match[2]
        };
      }
    }

    return { full: this.cleanText(text) };
  }

  /**
   * Utility methods
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      runtime,
      successRate: this.stats.requests > 0 ? (this.stats.successes / this.stats.requests) * 100 : 0,
      requestsPerSecond: this.stats.requests / (runtime / 1000)
    };
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  async scrape(url, options = {}) {
    throw new Error('scrape method must be implemented by subclass');
  }

  async parseEventData(rawData, source) {
    throw new Error('parseEventData method must be implemented by subclass');
  }
}

module.exports = BaseScrapingService;