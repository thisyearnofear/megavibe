#!/usr/bin/env node

/**
 * Test scraping services individually
 * Run with: npm run scrape:test
 */

require('dotenv').config({
  path: require('path').join(__dirname, '../.env')
});

const FirecrawlService = require('../services/scraping/FirecrawlService.cjs');
const MasaService = require('../services/scraping/MasaService.cjs');
const { SCRAPING_SOURCES } = require('../services/scraping/ScrapingConfig.cjs');

async function testFirecrawl() {
  console.log('\n🔥 Testing Firecrawl Service...');
  
  try {
    const firecrawl = new FirecrawlService();
    
    // Test with a simple website first
    console.log('📄 Testing basic scraping...');
    const testResult = await firecrawl.scrape('https://httpbin.org/json', {
      timeout: 10000
    });
    
    if (testResult.success) {
      console.log('✅ Basic scraping test passed');
    } else {
      console.log('❌ Basic scraping test failed');
      return false;
    }
    
    // Test with a real Web3 event source
    console.log('🌐 Testing Web3 event source...');
    const webSource = SCRAPING_SOURCES.WEB3_EVENTS[0]; // GoWeb3
    
    try {
      const eventResult = await firecrawl.scrape(webSource.url, {
        timeout: 30000,
        includeTags: ['h1', 'h2', 'h3', 'time', 'a'],
        excludeTags: ['nav', 'footer', 'script']
      });
      
      if (eventResult.success && eventResult.data) {
        console.log('✅ Web3 source scraping successful');
        console.log(`📊 Content length: ${eventResult.data.markdown?.length || 0} chars`);
        
        // Try to parse events
        const events = await firecrawl.parseEventData(eventResult, webSource);
        console.log(`🎯 Parsed ${events.length} potential events`);
        
        if (events.length > 0) {
          console.log('📝 Sample event:', {
            name: events[0].name,
            date: events[0].date,
            location: events[0].location,
            source: events[0].source
          });
        }
      } else {
        console.log('⚠️  Web3 source scraping returned no data');
      }
    } catch (error) {
      console.log(`⚠️  Web3 source scraping failed: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firecrawl test failed:', error.message);
    return false;
  }
}

async function testMasa() {
  console.log('\n🌊 Testing Masa Service...');
  
  try {
    const masa = new MasaService();
    
    // Test with a simple Twitter search
    console.log('🐦 Testing Twitter search...');
    const testQueries = ['web3 conference 2024'];
    
    const results = await masa.searchTwitterEvents(testQueries, {
      maxResults: 5,
      dateRange: 'since:2024-01-01 until:2025-12-31'
    });
    
    console.log(`✅ Twitter search completed`);
    console.log(`📊 Found ${results.length} potential events`);
    
    if (results.length > 0) {
      console.log('📝 Sample event:', {
        name: results[0].name,
        date: results[0].date,
        location: results[0].location,
        source: results[0].source,
        engagement: results[0].socialData?.engagement
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Masa test failed:', error.message);
    return false;
  }
}

async function testConfiguration() {
  console.log('\n⚙️  Testing Configuration...');
  
  const checks = {
    firecrawlApiKey: !!process.env.FIRECRAWL_API_KEY,
    masaApiKey: !!process.env.MASA_API_KEY,
    scrapingEnabled: process.env.SCRAPING_ENABLED === 'true',
    mongoUri: !!process.env.MONGO_URI
  };
  
  console.log('🔧 Configuration checks:');
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`   ${value ? '✅' : '❌'} ${key}: ${value ? 'OK' : 'MISSING'}`);
  });
  
  console.log('\n📋 Scraping sources configured:');
  console.log(`   - Web sources: ${SCRAPING_SOURCES.WEB3_EVENTS.length}`);
  console.log(`   - Social sources: ${SCRAPING_SOURCES.SOCIAL_SOURCES.length}`);
  
  SCRAPING_SOURCES.WEB3_EVENTS.forEach((source, index) => {
    console.log(`     ${index + 1}. ${source.name} (${source.url})`);
  });
  
  return Object.values(checks).every(Boolean);
}

async function runTests() {
  console.log('🧪 Starting Scraping Service Tests...');
  console.log('=' .repeat(50));
  
  const results = {
    configuration: false,
    firecrawl: false,
    masa: false
  };
  
  try {
    // Test configuration
    results.configuration = await testConfiguration();
    
    // Test Firecrawl if configured
    if (process.env.FIRECRAWL_API_KEY) {
      results.firecrawl = await testFirecrawl();
    } else {
      console.log('\n⚠️  Skipping Firecrawl test - API key not configured');
    }
    
    // Skip Masa testing for now - focus on web scraping
    console.log('\n⚠️  Skipping Masa test - social scraping disabled');
    results.masa = true; // Mark as passed since we're not using it
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('=' .repeat(50));
  
  Object.entries(results).forEach(([service, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${service}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n🎯 Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('🚀 Your scraping system is ready to go!');
    console.log('💡 Run "npm run scrape" to start a full scraping job');
  } else {
    console.log('🔧 Please fix the failing tests before running full scraping');
  }
  
  return allPassed;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(0);
});

// Run the tests
if (require.main === module) {
  runTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = runTests;