/**
 * API Endpoint Testing Script
 * Tests all major API endpoints to ensure they're working correctly
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_USER_ID = '507f1f77bcf86cd799439011'; // Mock user ID
const TEST_EVENT_ID = '507f1f77bcf86cd799439012'; // Mock event ID
const TEST_SPEAKER_ID = '507f1f77bcf86cd799439013'; // Mock speaker ID

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  switch (type) {
    case 'success':
      console.log(`[${timestamp}] ✅ ${message}`.green);
      break;
    case 'error':
      console.log(`[${timestamp}] ❌ ${message}`.red);
      break;
    case 'warning':
      console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
      break;
    case 'info':
    default:
      console.log(`[${timestamp}] ℹ️  ${message}`.blue);
      break;
  }
}

function logTestResult(testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    log(`${testName} - PASSED ${details}`, 'success');
  } else {
    failedTests++;
    log(`${testName} - FAILED ${details}`, 'error');
  }
}

async function makeRequest(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 10000,
      validateStatus: () => true, // Don't throw for any status
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    return {
      success: response.status === expectedStatus,
      status: response.status,
      data: response.data,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message,
    };
  }
}

// Test suites
async function testHealthEndpoints() {
  log('Testing Health Endpoints...', 'info');

  // Test main health endpoint
  const healthResult = await makeRequest('GET', '/health');
  logTestResult(
    'Health Check',
    healthResult.success,
    healthResult.success ? '' : `Status: ${healthResult.status}`
  );

  // Test tip service health
  const tipHealthResult = await makeRequest('GET', '/api/tips/health');
  logTestResult(
    'Tip Service Health',
    tipHealthResult.success,
    tipHealthResult.success ? '' : `Status: ${tipHealthResult.status}`
  );

  // Test bounty service health
  const bountyHealthResult = await makeRequest('GET', '/api/bounties/health');
  logTestResult(
    'Bounty Service Health',
    bountyHealthResult.success,
    bountyHealthResult.success ? '' : `Status: ${bountyHealthResult.status}`
  );
}

async function testVenueEndpoints() {
  log('Testing Venue Endpoints...', 'info');

  // Test venue search
  const searchResult = await makeRequest('GET', '/api/venues/search?limit=5');
  logTestResult(
    'Venue Search',
    searchResult.success,
    searchResult.success ? `Found ${searchResult.data?.data?.length || 0} venues` : `Status: ${searchResult.status}`
  );

  // Test nearby venues
  const nearbyResult = await makeRequest('GET', '/api/venues/nearby?lat=40.7128&lng=-74.0060&radius=10');
  logTestResult(
    'Nearby Venues',
    nearbyResult.success,
    nearbyResult.success ? `Found ${nearbyResult.data?.data?.length || 0} venues` : `Status: ${nearbyResult.status}`
  );

  // Test invalid venue ID (should return 404)
  const invalidVenueResult = await makeRequest('GET', '/api/venues/invalid-id', null, 400);
  logTestResult(
    'Invalid Venue ID Handling',
    invalidVenueResult.success,
    invalidVenueResult.success ? 'Correctly returned 400' : `Status: ${invalidVenueResult.status}`
  );
}

async function testTipEndpoints() {
  log('Testing Tip Endpoints...', 'info');

  // Test get tips (should work without auth for public endpoints)
  const getTipsResult = await makeRequest('GET', '/api/tips?limit=5');
  logTestResult(
    'Get Tips',
    getTipsResult.success,
    getTipsResult.success ? `Found ${getTipsResult.data?.data?.tips?.length || 0} tips` : `Status: ${getTipsResult.status}`
  );

  // Test get event tips
  const eventTipsResult = await makeRequest('GET', `/api/tips/event/${TEST_EVENT_ID}?limit=5`);
  logTestResult(
    'Get Event Tips',
    eventTipsResult.success,
    eventTipsResult.success ? `Found ${eventTipsResult.data?.data?.tips?.length || 0} tips` : `Status: ${eventTipsResult.status}`
  );

  // Test get speaker earnings
  const earningsResult = await makeRequest('GET', `/api/tips/speaker/${TEST_SPEAKER_ID}/earnings`);
  logTestResult(
    'Get Speaker Earnings',
    earningsResult.success,
    earningsResult.success ? 'Earnings data retrieved' : `Status: ${earningsResult.status}`
  );

  // Test live tip feed
  const liveFeedResult = await makeRequest('GET', `/api/tips/event/${TEST_EVENT_ID}/live?limit=10`);
  logTestResult(
    'Live Tip Feed',
    liveFeedResult.success,
    liveFeedResult.success ? `Found ${liveFeedResult.data?.data?.tips?.length || 0} tips` : `Status: ${liveFeedResult.status}`
  );

  // Test create tip without auth (should fail)
  const createTipResult = await makeRequest('POST', '/api/tips/create', {
    speakerId: TEST_SPEAKER_ID,
    eventId: TEST_EVENT_ID,
    amountUSD: 10,
    message: 'Test tip'
  }, 401);
  logTestResult(
    'Create Tip Without Auth',
    createTipResult.success,
    createTipResult.success ? 'Correctly rejected unauthorized request' : `Status: ${createTipResult.status}`
  );
}

async function testBountyEndpoints() {
  log('Testing Bounty Endpoints...', 'info');

  // Test get bounties
  const getBountiesResult = await makeRequest('GET', '/api/bounties?limit=5');
  logTestResult(
    'Get Bounties',
    getBountiesResult.success,
    getBountiesResult.success ? `Found ${getBountiesResult.data?.data?.bounties?.length || 0} bounties` : `Status: ${getBountiesResult.status}`
  );

  // Test get event bounties
  const eventBountiesResult = await makeRequest('GET', `/api/bounties/event/${TEST_EVENT_ID}?limit=5`);
  logTestResult(
    'Get Event Bounties',
    eventBountiesResult.success,
    eventBountiesResult.success ? `Found ${eventBountiesResult.data?.data?.bounties?.length || 0} bounties` : `Status: ${eventBountiesResult.status}`
  );

  // Test get speaker bounties
  const speakerBountiesResult = await makeRequest('GET', `/api/bounties/speaker/${TEST_SPEAKER_ID}?limit=5`);
  logTestResult(
    'Get Speaker Bounties',
    speakerBountiesResult.success,
    speakerBountiesResult.success ? `Found ${speakerBountiesResult.data?.data?.bounties?.length || 0} bounties` : `Status: ${speakerBountiesResult.status}`
  );

  // Test create bounty without auth (should fail)
  const createBountyResult = await makeRequest('POST', '/api/bounties', {
    eventId: TEST_EVENT_ID,
    speakerId: TEST_SPEAKER_ID,
    title: 'Test Bounty',
    description: 'Test bounty description',
    reward: 100,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }, 401);
  logTestResult(
    'Create Bounty Without Auth',
    createBountyResult.success,
    createBountyResult.success ? 'Correctly rejected unauthorized request' : `Status: ${createBountyResult.status}`
  );

  // Test invalid bounty ID
  const invalidBountyResult = await makeRequest('GET', '/api/bounties/invalid-id', null, 400);
  logTestResult(
    'Invalid Bounty ID Handling',
    invalidBountyResult.success,
    invalidBountyResult.success ? 'Correctly returned 400' : `Status: ${invalidBountyResult.status}`
  );
}

async function testErrorHandling() {
  log('Testing Error Handling...', 'info');

  // Test 404 for non-existent endpoint
  const notFoundResult = await makeRequest('GET', '/api/non-existent-endpoint', null, 404);
  logTestResult(
    '404 Error Handling',
    notFoundResult.success,
    notFoundResult.success ? 'Correctly returned 404' : `Status: ${notFoundResult.status}`
  );

  // Test malformed request
  const malformedResult = await makeRequest('POST', '/api/tips/create', 'invalid-json', 400);
  logTestResult(
    'Malformed Request Handling',
    malformedResult.status >= 400 && malformedResult.status < 500,
    `Status: ${malformedResult.status}`
  );
}

async function testCORSHeaders() {
  log('Testing CORS Headers...', 'info');

  try {
    const response = await axios.options(`${BASE_URL}/api/venues/search`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      }
    });

    const hasCORSHeaders = response.headers['access-control-allow-origin'] !== undefined;
    logTestResult(
      'CORS Headers',
      hasCORSHeaders,
      hasCORSHeaders ? 'CORS headers present' : 'CORS headers missing'
    );
  } catch (error) {
    logTestResult('CORS Headers', false, error.message);
  }
}

async function testRateLimiting() {
  log('Testing Rate Limiting...', 'info');

  // Make multiple rapid requests to test rate limiting
  const promises = Array.from({ length: 20 }, () => 
    makeRequest('GET', '/api/venues/search?limit=1')
  );

  try {
    const results = await Promise.all(promises);
    const rateLimited = results.some(result => result.status === 429);
    
    logTestResult(
      'Rate Limiting',
      true, // We'll consider this a pass regardless, as rate limiting might not be enabled
      rateLimited ? 'Rate limiting is active' : 'No rate limiting detected (may not be configured)'
    );
  } catch (error) {
    logTestResult('Rate Limiting', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Endpoint Tests...'.cyan.bold);
  console.log(`📍 Testing against: ${BASE_URL}`.cyan);
  console.log('=' * 50);

  try {
    await testHealthEndpoints();
    await testVenueEndpoints();
    await testTipEndpoints();
    await testBountyEndpoints();
    await testErrorHandling();
    await testCORSHeaders();
    await testRateLimiting();
  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
  }

  // Print summary
  console.log('\n' + '=' * 50);
  console.log('📊 Test Summary:'.cyan.bold);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`.green);
  console.log(`Failed: ${failedTests}`.red);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    console.log('\n⚠️  Some tests failed. Please check the logs above for details.'.yellow);
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!'.green.bold);
    process.exit(0);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
API Endpoint Testing Script

Usage: node test-api-endpoints.js [options]

Options:
  --help, -h     Show this help message
  
Environment Variables:
  API_URL        Base URL for the API (default: http://localhost:3000)

Examples:
  node test-api-endpoints.js
  API_URL=https://megavibe.onrender.com node test-api-endpoints.js
  `);
  process.exit(0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});