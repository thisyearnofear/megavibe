#!/usr/bin/env node

/**
 * Debug scraping script - see what content we're actually getting
 */

require('dotenv').config({
  path: require('path').join(__dirname, '../.env')
});

const FirecrawlService = require('../services/scraping/FirecrawlService.cjs');
const { SCRAPING_SOURCES } = require('../services/scraping/ScrapingConfig.cjs');

async function debugScraping() {
  console.log('🔍 Debug Scraping - Analyzing Content...');
  
  try {
    const firecrawl = new FirecrawlService();
    const source = SCRAPING_SOURCES.WEB3_EVENTS[0]; // GoWeb3
    
    console.log(`\n📄 Scraping: ${source.name} (${source.url})`);
    
    const result = await firecrawl.scrape(source.url, {
      timeout: 30000,
      includeTags: ['h1', 'h2', 'h3', 'h4', 'p', 'div', 'span', 'time', 'a'],
      excludeTags: ['nav', 'footer', 'script', 'style']
    });
    
    if (result.success && result.data) {
      console.log('\n✅ Scraping successful!');
      console.log(`📊 Markdown length: ${result.data.markdown?.length || 0} chars`);
      console.log(`📊 HTML length: ${result.data.html?.length || 0} chars`);
      
      // Show first 1000 chars of markdown
      if (result.data.markdown) {
        console.log('\n📝 First 1000 chars of markdown:');
        console.log('=' .repeat(50));
        console.log(result.data.markdown.substring(0, 1000));
        console.log('=' .repeat(50));
        
        // Look for event-related keywords
        const eventKeywords = ['conference', 'summit', 'meetup', 'event', 'hackathon', '2024', '2025'];
        const foundKeywords = eventKeywords.filter(keyword => 
          result.data.markdown.toLowerCase().includes(keyword)
        );
        
        console.log(`\n🔍 Found keywords: ${foundKeywords.join(', ')}`);
        
        // Look for dates
        const datePatterns = [
          /\w+\s+\d{1,2}(?:-\d{1,2})?,?\s+\d{4}/g,
          /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/g,
          /\d{4}-\d{2}-\d{2}/g
        ];
        
        const foundDates = [];
        datePatterns.forEach(pattern => {
          const matches = result.data.markdown.match(pattern);
          if (matches) {
            foundDates.push(...matches);
          }
        });
        
        console.log(`🗓️  Found potential dates: ${foundDates.slice(0, 5).join(', ')}`);
        
        // Try parsing with current logic
        console.log('\n🧠 Testing current parsing logic...');
        const events = await firecrawl.parseEventData(result, source);
        console.log(`📊 Parsed events: ${events.length}`);
        
        if (events.length > 0) {
          console.log('📝 Sample events:');
          events.slice(0, 3).forEach((event, index) => {
            console.log(`   ${index + 1}. ${event.name}`);
            console.log(`      Date: ${event.date || 'Not found'}`);
            console.log(`      Location: ${event.location?.full || 'Not found'}`);
          });
        }
        
        // Manual parsing attempt
        console.log('\n🔧 Manual parsing attempt...');
        const lines = result.data.markdown.split('\n');
        const eventLines = lines.filter(line => {
          const lower = line.toLowerCase();
          return (lower.includes('conference') || 
                  lower.includes('summit') || 
                  lower.includes('event') ||
                  lower.includes('meetup')) &&
                 line.length > 10 && 
                 line.length < 100;
        });
        
        console.log(`📋 Found ${eventLines.length} potential event lines:`);
        eventLines.slice(0, 5).forEach((line, index) => {
          console.log(`   ${index + 1}. ${line.trim()}`);
        });
        
      } else {
        console.log('❌ No markdown content received');
      }
      
      // Check metadata
      if (result.data.metadata) {
        console.log('\n📋 Page metadata:');
        console.log(`   Title: ${result.data.metadata.title || 'Not found'}`);
        console.log(`   Description: ${result.data.metadata.description || 'Not found'}`);
        console.log(`   Status: ${result.data.metadata.statusCode || 'Unknown'}`);
      }
      
    } else {
      console.log('❌ Scraping failed or returned no data');
      console.log('Result:', result);
    }
    
  } catch (error) {
    console.error('💥 Debug scraping failed:', error.message);
  }
}

// Run the debug
if (require.main === module) {
  debugScraping().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = debugScraping;