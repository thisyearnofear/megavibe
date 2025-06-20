/**
 * Masa API service implementation
 * Handles social media scraping using Masa Data API
 */

const BaseScrapingService = require('./BaseScrapingService.cjs');
const fetch = require('node-fetch');

class MasaService extends BaseScrapingService {
  constructor(options = {}) {
    super('Masa', options);
    this.apiKey = process.env.MASA_API_KEY;
    this.baseUrl = 'https://data.masa.ai/api/v1';
    
    if (!this.apiKey) {
      throw new Error('MASA_API_KEY environment variable is required');
    }
  }

  /**
   * Search Twitter for Web3 events
   */
  async searchTwitterEvents(queries, options = {}) {
    const results = [];
    
    for (const query of queries) {
      await this.checkRateLimit('masa');
      
      const cacheKey = `${this.options.CACHE.keyPrefix}masa:twitter:${query}`;
      const cached = this.getCached(cacheKey);
      
      if (cached) {
        results.push(...cached);
        continue;
      }

      try {
        const searchResult = await this.searchTwitter(query, options);
        const events = await this.parseTwitterEvents(searchResult, query);
        
        this.setCached(cacheKey, events);
        results.push(...events);
        
        // Rate limiting for Twitter API
        await this.sleep(1000 / 3); // 3 requests per second max
      } catch (error) {
        this.emit('error', {
          operation: 'searchTwitterEvents',
          query,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Search Twitter using Masa API
   */
  async searchTwitter(query, options = {}) {
    const searchData = {
      type: 'twitter-credential-scraper',
      arguments: {
        query: this.buildTwitterQuery(query, options),
        max_results: options.maxResults || 50
      }
    };

    const jobResult = await this.withRetry(
      () => this.makeMasaRequest('/search/live/twitter', searchData),
      { operation: 'searchTwitter', query }
    );

    // Poll for results
    return await this.pollTwitterJob(jobResult.id || jobResult.jobId);
  }

  /**
   * Build optimized Twitter search query
   */
  buildTwitterQuery(baseQuery, options = {}) {
    const {
      dateRange = 'until:2025-12-31 since:2024-01-01',
      excludeRetweets = true,
      minRetweets = 5,
      language = 'en'
    } = options;

    let query = baseQuery;
    
    // Add date range
    if (dateRange) {
      query += ` ${dateRange}`;
    }
    
    // Exclude retweets
    if (excludeRetweets) {
      query += ' -is:retweet';
    }
    
    // Minimum engagement
    if (minRetweets) {
      query += ` min_retweets:${minRetweets}`;
    }
    
    // Language filter
    if (language) {
      query += ` lang:${language}`;
    }

    // Add event-specific keywords
    query += ' (conference OR summit OR meetup OR event OR "save the date")';
    
    return query;
  }

  /**
   * Parse Twitter results to extract event information
   */
  async parseTwitterEvents(twitterData, originalQuery) {
    const events = [];
    
    if (!twitterData || !twitterData.data) {
      return events;
    }

    for (const tweet of twitterData.data) {
      try {
        const eventData = this.extractEventFromTweet(tweet, originalQuery);
        if (eventData) {
          events.push(eventData);
        }
      } catch (error) {
        this.emit('parseError', {
          tweet: tweet.id,
          error: error.message
        });
      }
    }

    return events;
  }

  /**
   * Extract event information from a single tweet
   */
  extractEventFromTweet(tweet, query) {
    const text = tweet.text || tweet.full_text || '';
    const urls = tweet.entities?.urls || [];
    
    // Event detection patterns
    const eventPatterns = [
      /(?:join us|save the date|register now|tickets available).{0,100}(?:conference|summit|meetup|event)/i,
      /(?:announcing|excited to announce).{0,100}(?:conference|summit|event)/i,
      /(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\w+ \d{1,2}, \d{4}).{0,100}(?:conference|summit|event)/i
    ];

    const isEvent = eventPatterns.some(pattern => pattern.test(text));
    if (!isEvent) return null;

    // Extract event name
    const nameMatch = text.match(/(?:announcing|join us for|welcome to)\s+([^.!?]+)/i);
    const eventName = nameMatch ? nameMatch[1].trim() : this.extractEventNameFromText(text);

    // Extract date
    const dateMatch = text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\w+ \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2})/);
    let eventDate = null;
    if (dateMatch) {
      try {
        eventDate = this.parseDate(dateMatch[1]);
      } catch (error) {
        // Date parsing failed, skip
      }
    }

    // Extract location
    const location = this.extractLocationFromTweet(text);

    // Extract URLs for more info
    const eventUrls = urls
      .filter(url => !url.expanded_url.includes('twitter.com'))
      .map(url => url.expanded_url);

    if (!eventName || eventName.length < 3) return null;

    return {
      name: this.cleanText(eventName),
      date: eventDate,
      location: location,
      description: this.cleanText(text.substring(0, 200)),
      source: 'Twitter',
      sourceUrl: `https://twitter.com/user/status/${tweet.id}`,
      socialData: {
        platform: 'twitter',
        tweetId: tweet.id,
        author: tweet.user?.screen_name || tweet.author_id,
        engagement: {
          retweets: tweet.retweet_count || 0,
          likes: tweet.favorite_count || tweet.public_metrics?.like_count || 0,
          replies: tweet.reply_count || tweet.public_metrics?.reply_count || 0
        },
        urls: eventUrls
      },
      tags: this.extractTagsFromQuery(query),
      scrapedAt: new Date()
    };
  }

  /**
   * Extract event name from tweet text
   */
  extractEventNameFromText(text) {
    // Remove URLs, mentions, hashtags for cleaner extraction
    const cleanText = text
      .replace(/https?:\/\/\S+/g, '')
      .replace(/@\w+/g, '')
      .replace(/#\w+/g, '')
      .trim();

    // Try to find event name patterns
    const patterns = [
      /(?:at|for|to)\s+([A-Z][^.!?]{10,50})/,
      /([A-Z][^.!?]{10,50})(?:\s+(?:conference|summit|event|meetup))/i,
      /^([^.!?]{10,50})/
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return cleanText.substring(0, 50);
  }

  /**
   * Extract location from tweet text
   */
  extractLocationFromTweet(text) {
    // Location patterns
    const locationPatterns = [
      /(?:in|at|@)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+)/g,
      /(?:in|at|@)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /📍\s*([^.!?\n]+)/g
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.extractLocation(match[1]);
      }
    }

    return null;
  }

  /**
   * Extract tags from search query
   */
  extractTagsFromQuery(query) {
    const baseTags = ['web3', 'crypto', 'blockchain'];
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const additionalTags = queryWords.filter(word => 
      word.length > 3 && 
      !['conference', 'event', 'meetup', 'summit'].includes(word) &&
      !word.includes(':') &&
      !word.startsWith('-')
    );

    return [...baseTags, ...additionalTags].slice(0, 5);
  }

  /**
   * Web scraping using Masa (if available)
   */
  async scrapeWeb(url, options = {}) {
    // Check if Masa supports web scraping
    const scrapeData = {
      url,
      ...options
    };

    try {
      return await this.withRetry(
        () => this.makeMasaRequest('/search/live/web/scrape', scrapeData),
        { operation: 'scrapeWeb', url }
      );
    } catch (error) {
      // Masa might not support web scraping yet
      this.emit('error', {
        operation: 'scrapeWeb',
        error: 'Web scraping not available via Masa API',
        url
      });
      return null;
    }
  }

  /**
   * Make API request to Masa
   */
  async makeMasaRequest(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Masa API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Poll Twitter job for completion
   */
  async pollTwitterJob(jobId, maxWaitTime = 120000) { // 2 minutes
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(`${this.baseUrl}/search/live/twitter/result/${jobId}`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });

        if (response.ok) {
          const result = await response.json();
          if (result && (result.data || result.results)) {
            return result;
          }
        }

        // Wait before next poll
        await this.sleep(5000);
      } catch (error) {
        // Continue polling on error
        await this.sleep(5000);
      }
    }

    throw new Error('Twitter job polling timeout');
  }

  /**
   * Parse event data (implementation of abstract method)
   */
  async parseEventData(rawData, source) {
    if (source.platform === 'twitter') {
      return await this.parseTwitterEvents(rawData, source.query);
    }
    
    return [];
  }

  /**
   * Scrape method (implementation of abstract method)
   */
  async scrape(query, options = {}) {
    if (options.platform === 'twitter') {
      return await this.searchTwitter(query, options);
    }
    
    return await this.scrapeWeb(query, options);
  }
}

module.exports = MasaService;