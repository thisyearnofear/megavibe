#!/usr/bin/env node

/**
 * Test scraping with a simpler, more reliable source
 */

require('dotenv').config({
  path: require('path').join(__dirname, '../.env')
});

const FirecrawlService = require('../services/scraping/FirecrawlService.cjs');

async function testSpecificScraping() {
  console.log('🎯 Testing with a more reliable event source...');
  
  try {
    const firecrawl = new FirecrawlService();
    
    // Test with a more structured event listing
    const testSources = [
      {
        name: 'CoinDesk Events',
        url: 'https://www.coindesk.com/events/',
        type: 'events_listing'
      },
      {
        name: 'Cointelegraph Events',
        url: 'https://cointelegraph.com/events',
        type: 'events_listing'
      },
      {
        name: 'Web3 Foundation Events',
        url: 'https://web3.foundation/events/',
        type: 'events_listing'
      }
    ];
    
    for (const source of testSources) {
      console.log(`\n🔍 Testing: ${source.name}`);
      
      try {
        const result = await firecrawl.scrape(source.url, {
          timeout: 20000,
          includeTags: ['h1', 'h2', 'h3', 'h4', 'p', 'div', 'time', 'a'],
          excludeTags: ['nav', 'footer', 'script', 'style', 'ads']
        });
        
        if (result.success && result.data?.markdown) {
          console.log(`✅ ${source.name}: ${result.data.markdown.length} chars`);
          
          // Look for event patterns
          const markdown = result.data.markdown;
          const eventKeywords = ['conference', 'summit', 'meetup', 'event', 'hackathon', '2024', '2025'];
          const foundKeywords = eventKeywords.filter(keyword => 
            markdown.toLowerCase().includes(keyword)
          );
          
          console.log(`   Keywords: ${foundKeywords.join(', ')}`);
          
          // Extract potential event titles (lines with event keywords)
          const lines = markdown.split('\n');
          const eventLines = lines.filter(line => {
            const lower = line.toLowerCase();
            return (lower.includes('conference') || 
                    lower.includes('summit') || 
                    lower.includes('event') ||
                    lower.includes('meetup') ||
                    lower.includes('hackathon')) &&
                   line.length > 10 && 
                   line.length < 150 &&
                   !line.includes('http') &&
                   !lower.includes('newsletter') &&
                   !lower.includes('subscribe');
          });
          
          console.log(`   Found ${eventLines.length} potential events`);
          if (eventLines.length > 0) {
            console.log('   Sample events:');
            eventLines.slice(0, 3).forEach((line, index) => {
              console.log(`     ${index + 1}. ${line.trim()}`);
            });
          }
          
        } else {
          console.log(`❌ ${source.name}: Failed to scrape`);
        }
        
      } catch (error) {
        console.log(`❌ ${source.name}: ${error.message}`);
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test with a simple static event list
    console.log('\n🧪 Creating mock events for testing...');
    const mockEvents = [
      {
        name: 'ETHDenver 2025',
        date: new Date('2025-02-20'),
        location: { full: 'Denver, Colorado, USA' },
        description: 'The largest Web3 hackathon and conference',
        source: 'Manual',
        sourceUrl: 'https://ethdenver.com',
        tags: ['ethereum', 'hackathon', 'web3']
      },
      {
        name: 'Consensus 2025',
        date: new Date('2025-05-15'),
        location: { full: 'Austin, Texas, USA' },
        description: 'CoinDesk\'s premier blockchain conference',
        source: 'Manual',
        sourceUrl: 'https://consensus.coindesk.com',
        tags: ['blockchain', 'conference', 'crypto']
      },
      {
        name: 'Token2049 Singapore 2025',
        date: new Date('2025-09-18'),
        location: { full: 'Singapore' },
        description: 'Premier crypto conference in Asia',
        source: 'Manual',
        sourceUrl: 'https://token2049.com',
        tags: ['crypto', 'asia', 'conference']
      }
    ];
    
    console.log(`✅ Created ${mockEvents.length} mock events for testing`);
    mockEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.name} - ${event.date.toDateString()} - ${event.location.full}`);
    });
    
    return mockEvents;
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return [];
  }
}

// Run the test
if (require.main === module) {
  testSpecificScraping().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = testSpecificScraping;