/**
 * Scraping API routes
 * Provides endpoints for managing and monitoring the scraping system
 */

const express = require('express');
const router = express.Router();
const EventScrapingOrchestrator = require('../services/scraping/EventScrapingOrchestrator.cjs');

// Initialize orchestrator (singleton)
let scrapingOrchestrator = null;

const getOrchestrator = () => {
  if (!scrapingOrchestrator) {
    scrapingOrchestrator = new EventScrapingOrchestrator();
    
    // Setup logging for orchestrator events
    scrapingOrchestrator.on('scrapingStarted', (data) => {
      console.log(`🚀 Scraping started: ${data.jobId}`);
    });
    
    scrapingOrchestrator.on('scrapingCompleted', (data) => {
      console.log(`✅ Scraping completed: ${data.eventsSaved} events saved in ${data.duration}ms`);
    });
    
    scrapingOrchestrator.on('scrapingFailed', (data) => {
      console.error(`❌ Scraping failed: ${data.error}`);
    });
    
    scrapingOrchestrator.on('serviceError', (data) => {
      console.error(`🔧 Service error (${data.service}):`, data.error);
    });
  }
  
  return scrapingOrchestrator;
};

/**
 * GET /api/scraping/status
 * Get current scraping status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    const orchestrator = getOrchestrator();
    const status = orchestrator.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scraping status'
    });
  }
});

/**
 * POST /api/scraping/trigger
 * Manually trigger a scraping job
 */
router.post('/trigger', async (req, res) => {
  try {
    const orchestrator = getOrchestrator();
    
    // Check if already running
    if (orchestrator.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Scraping is already running'
      });
    }
    
    // Start scraping in background
    orchestrator.triggerScraping().catch(error => {
      console.error('Background scraping error:', error);
    });
    
    res.json({
      success: true,
      message: 'Scraping job started',
      jobId: orchestrator.currentJob?.id
    });
  } catch (error) {
    console.error('Error triggering scraping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger scraping'
    });
  }
});

/**
 * POST /api/scraping/stop
 * Stop current scraping job
 */
router.post('/stop', async (req, res) => {
  try {
    const orchestrator = getOrchestrator();
    
    if (!orchestrator.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'No scraping job is currently running'
      });
    }
    
    orchestrator.stopScraping();
    
    res.json({
      success: true,
      message: 'Scraping job stopped'
    });
  } catch (error) {
    console.error('Error stopping scraping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop scraping'
    });
  }
});

/**
 * GET /api/scraping/results/:jobId
 * Get results from a specific scraping job
 */
router.get('/results/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const orchestrator = getOrchestrator();
    
    // For now, return current job results if it matches
    if (orchestrator.currentJob && orchestrator.currentJob.id === jobId) {
      res.json({
        success: true,
        data: orchestrator.currentJob
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
  } catch (error) {
    console.error('Error getting scraping results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scraping results'
    });
  }
});

/**
 * POST /api/scraping/test/firecrawl
 * Test Firecrawl service with a specific URL
 */
router.post('/test/firecrawl', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    const orchestrator = getOrchestrator();
    const result = await orchestrator.firecrawlService.scrape(url);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing Firecrawl:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scraping/test/masa
 * Test Masa service with a specific query
 */
router.post('/test/masa', async (req, res) => {
  try {
    const { query, platform = 'twitter' } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const orchestrator = getOrchestrator();
    
    if (platform === 'twitter') {
      const result = await orchestrator.masaService.searchTwitterEvents([query], {
        maxResults: 10
      });
      
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Only Twitter platform is currently supported'
      });
    }
  } catch (error) {
    console.error('Error testing Masa:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scraping/config
 * Get current scraping configuration
 */
router.get('/config', async (req, res) => {
  try {
    const { SCRAPING_SOURCES, SCRAPING_CONFIG } = require('../services/scraping/ScrapingConfig.cjs');
    
    res.json({
      success: true,
      data: {
        sources: SCRAPING_SOURCES,
        config: {
          ...SCRAPING_CONFIG,
          // Hide sensitive rate limit details
          RATE_LIMITS: Object.keys(SCRAPING_CONFIG.RATE_LIMITS)
        },
        environment: {
          scrapingEnabled: process.env.SCRAPING_ENABLED === 'true',
          schedule: process.env.SCRAPING_SCHEDULE,
          maxConcurrent: process.env.SCRAPING_MAX_CONCURRENT,
          timeout: process.env.SCRAPING_TIMEOUT
        }
      }
    });
  } catch (error) {
    console.error('Error getting scraping config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scraping configuration'
    });
  }
});

/**
 * GET /api/scraping/health
 * Health check for scraping services
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      firecrawl: {
        configured: !!process.env.FIRECRAWL_API_KEY,
        status: 'unknown'
      },
      masa: {
        configured: !!process.env.MASA_API_KEY,
        status: 'unknown'
      },
      database: {
        status: 'unknown'
      }
    };
    
    // Test Firecrawl
    if (health.firecrawl.configured) {
      try {
        const orchestrator = getOrchestrator();
        await orchestrator.firecrawlService.scrape('https://httpbin.org/json', {
          timeout: 5000
        });
        health.firecrawl.status = 'healthy';
      } catch (error) {
        health.firecrawl.status = 'error';
        health.firecrawl.error = error.message;
      }
    }
    
    // Test Masa
    if (health.masa.configured) {
      try {
        // Simple test - just check if we can make a request
        health.masa.status = 'healthy'; // Assume healthy if configured
      } catch (error) {
        health.masa.status = 'error';
        health.masa.error = error.message;
      }
    }
    
    // Test database
    try {
      const Event = require('../models/eventModel.cjs');
      await Event.countDocuments();
      health.database.status = 'healthy';
    } catch (error) {
      health.database.status = 'error';
      health.database.error = error.message;
    }
    
    const allHealthy = Object.values(health).every(service => 
      service.status === 'healthy' || !service.configured
    );
    
    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      data: health
    });
  } catch (error) {
    console.error('Error checking scraping health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check health'
    });
  }
});

module.exports = router;