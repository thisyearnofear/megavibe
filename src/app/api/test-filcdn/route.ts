import { NextRequest, NextResponse } from 'next/server';
import { createRealFilCDNService } from '@/services/filcdn/realFilcdnService';

/**
 * Test endpoint to verify Synapse SDK integration
 * GET /api/test-filcdn - Test basic SDK functionality
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Synapse SDK integration...');
    
    // Create FilCDN service with test configuration
    const filcdnService = createRealFilCDNService({
      privateKey: process.env.FILCDN_PRIVATE_KEY,
      rpcURL: process.env.NEXT_PUBLIC_FILECOIN_RPC_URL,
      withCDN: true
    });

    // Test 1: Check if SDK can be loaded
    console.log('📦 Testing SDK loading...');
    const { getSynapseSDK, isMockSDK } = await import('@/services/filcdn/synapseSDK');
    const sdk = await getSynapseSDK();
    
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: {
        sdkLoading: {
          success: !!sdk,
          isProductionSDK: !isMockSDK(),
          hasRequiredExports: !!(sdk.Synapse && sdk.RPC_URLS)
        },
        environment: {
          hasPrivateKey: !!process.env.FILCDN_PRIVATE_KEY,
          hasRpcUrl: !!process.env.NEXT_PUBLIC_FILECOIN_RPC_URL,
          nodeEnv: process.env.NODE_ENV,
          filcdnEnabled: process.env.NEXT_PUBLIC_FILCDN_ENABLED === 'true'
        },
        configuration: {
          rpcUrl: process.env.NEXT_PUBLIC_FILECOIN_RPC_URL,
          network: 'calibration', // Using testnet for safety
          withCDN: true
        }
      }
    };

    // Test 2: Try to get service stats (this will test initialization)
    try {
      console.log('📊 Testing service stats...');
      const stats = await filcdnService.getStats();
      testResults.tests.serviceStats = {
        success: true,
        stats: stats
      };
    } catch (error) {
      console.warn('⚠️ Service stats test failed:', error);
      testResults.tests.serviceStats = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 3: Test a small data storage operation (if in development)
    if (process.env.NODE_ENV === 'development' && process.env.FILCDN_PRIVATE_KEY) {
      try {
        console.log('💾 Testing small data storage...');
        const testData = JSON.stringify({
          test: true,
          timestamp: Date.now(),
          message: 'MegaVibe FilCDN test data'
        });
        
        const result = await filcdnService.storeData(testData);
        testResults.tests.dataStorage = {
          success: true,
          cid: result.cid,
          size: result.size,
          url: result.url
        };
      } catch (error) {
        console.warn('⚠️ Data storage test failed:', error);
        testResults.tests.dataStorage = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      testResults.tests.dataStorage = {
        skipped: true,
        reason: 'Not in development environment or missing private key'
      };
    }

    console.log('✅ Synapse SDK integration test completed');
    
    return NextResponse.json({
      success: true,
      message: 'Synapse SDK integration test completed',
      results: testResults
    });

  } catch (error) {
    console.error('❌ Synapse SDK integration test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Synapse SDK integration test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
