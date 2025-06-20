/**
 * Centralized scraping configuration
 * Keeps all scraping sources and settings in one place
 */

const SCRAPING_SOURCES = {
  WEB3_EVENTS: [
    {
      name: 'GoWeb3',
      url: 'https://goweb3.fyi/',
      type: 'events_listing',
      selectors: {
        events: '.event-card, .conference-item, [data-event]',
        title: 'h1, h2, h3, .title, .event-title',
        date: 'time, .date, .event-date, [datetime]',
        location: '.location, .venue, .city',
        description: '.description, .summary, p',
        link: 'a[href]'
      },
      patterns: {
        date: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\w+ \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2})/g,
        location: /([\w\s]+,\s*[\w\s]+)/g,
        eventName: /^([^-–|]+)/
      }
    },
    {
      name: 'OnChain',
      url: 'https://onchain.org/web3-conferences/',
      type: 'events_listing',
      selectors: {
        events: '.conference, .event-item, .listing',
        title: 'h2, h3, .conference-title',
        date: '.date, time, .when',
        location: '.location, .where',
        description: '.description, .about',
        link: 'a'
      }
    },
    {
      name: 'Luma Crypto',
      url: 'https://lu.ma/crypto',
      type: 'events_listing',
      selectors: {
        events: '[data-testid="event-card"], .event-item',
        title: 'h3, .event-title',
        date: 'time, .date-time',
        location: '.location-text',
        description: '.event-description',
        link: 'a[href*="/event/"]'
      }
    }
  ],

  SOCIAL_SOURCES: [
    // Disabled for now - focus on web scraping only
    // {
    //   name: 'Twitter Web3 Events',
    //   platform: 'twitter',
    //   queries: [
    //     'web3 conference 2024 2025',
    //     'ethereum event devcon',
    //     'blockchain conference',
    //     'crypto meetup',
    //     'defi summit'
    //   ]
    // }
  ]
};

const SCRAPING_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    firecrawl: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    },
    masa: {
      requestsPerSecond: 3,
      requestsPerMinute: 180
    }
  },

  // Retry configuration
  RETRY: {
    maxAttempts: parseInt(process.env.SCRAPING_RETRY_ATTEMPTS) || 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  },

  // Timeouts
  TIMEOUTS: {
    scraping: parseInt(process.env.SCRAPING_TIMEOUT) || 30000,
    processing: 10000,
    database: 5000
  },

  // Concurrency
  CONCURRENCY: {
    maxConcurrent: parseInt(process.env.SCRAPING_MAX_CONCURRENT) || 5,
    batchSize: 10
  },

  // Data validation
  VALIDATION: {
    minEventNameLength: 3,
    maxEventNameLength: 200,
    requiredFields: ['name', 'date'],
    dateFormats: [
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'MMMM DD, YYYY',
      'MMM DD, YYYY'
    ]
  },

  // Caching
  CACHE: {
    ttl: 24 * 60 * 60, // 24 hours
    maxSize: 1000,
    keyPrefix: 'scraping:'
  }
};

module.exports = {
  SCRAPING_SOURCES,
  SCRAPING_CONFIG
};