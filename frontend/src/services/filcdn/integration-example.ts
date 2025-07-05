/**
 * FilCDN Integration Example
 *
 * This file demonstrates how to integrate the real FilCDN service with the frontend application.
 * It shows how to:
 * 1. Initialize the FilCDN service
 * 2. Store content on FilCDN
 * 3. Retrieve content from FilCDN
 * 4. Get CDN URLs for content
 *
 * This is for demonstration purposes and can be used as a reference for
 * implementing the real FilCDN service in the application.
 */

import { useState, useEffect, useCallback } from 'react';
import { createRealFilCDNService, RealFilCDNService, StorageResult, RetrievalResult } from './realFilcdnService';

// Example integration with the existing frontend
async function exampleUsage() {
  console.log('🚀 FilCDN Integration Example');
  
  // Step 1: Create and initialize the service
  console.log('Initializing FilCDN service...');
  const filcdnService = createRealFilCDNService({
    // In a real application, these would come from environment variables
    // or secure server-side API calls for the private key
    rpcURL: process.env.NEXT_PUBLIC_FILECOIN_RPC_URL,
    withCDN: process.env.NEXT_PUBLIC_FILCDN_ENABLED === 'true',
  });
  
  try {
    // Initialize the service
    await filcdnService.initialize();
    console.log('✅ FilCDN service initialized successfully');
    
    // Step 2: Store some example content
    console.log('Storing example content...');
    const exampleData = {
      title: 'Example MegaVibe Content',
      description: 'This is an example of content stored on FilCDN',
      timestamp: Date.now(),
      metadata: {
        author: 'MegaVibe User',
        type: 'Example',
        tags: ['example', 'filcdn', 'megavibe']
      }
    };
    
    const storageResult = await filcdnService.storeData(exampleData);
    console.log('✅ Content stored successfully with CID:', storageResult.cid);
    console.log('CDN URL:', storageResult.url);
    
    // Step 3: Retrieve the content
    console.log('Retrieving content...');
    const retrievalResult = await filcdnService.retrieveData(storageResult.cid);
    console.log('✅ Content retrieved successfully:');
    console.log('MIME Type:', retrievalResult.mimeType);
    console.log('Data:', retrievalResult.data);
    
    // Step 4: Get service statistics
    console.log('Getting service statistics...');
    const stats = await filcdnService.getStats();
    console.log('FilCDN Service Stats:', stats);
    
    return {
      success: true,
      cid: storageResult.cid,
      url: storageResult.url,
      data: retrievalResult.data
    };
  } catch (error) {
    console.error('❌ Error during FilCDN integration example:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Integration with React components
 *
 * This shows how we would integrate with React components
 * in the actual application.
 *
 * PERFORMANCE NOTE:
 * Based on our test results (data/filcdn-test-results.json):
 * - Upload: ~88 seconds for a small file
 * - Download: ~1.2 seconds for the same file
 * - Speed improvement: ~75x faster download vs upload
 *
 * This confirms FilCDN provides significant performance benefits for content delivery.
 */

// Example React hook for a component
function useFilCDNExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const runExample = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await exampleUsage();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    loading,
    error,
    result,
    runExample
  };
}

// Example integration with the FilCDNContext
// This is a guide for how to implement this in FilCDNContext.tsx
function FilCDNContextExample() {
  // NOTE: This is an example showing how the real implementation would look
  // These state variables would be defined in your actual FilCDNContext component
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Environment config would come from your actual app
  const env = {
    filcdn: {
      rpcUrl: process.env.NEXT_PUBLIC_FILECOIN_RPC_URL || '',
      withCDN: true
    }
  };
  
  // Create the service
  const filcdnService = createRealFilCDNService({
    rpcURL: env.filcdn.rpcUrl,
    withCDN: env.filcdn.withCDN,
  });
  
  // Initialize the service in useEffect
  useEffect(() => {
    const initializeFilCDN = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        await filcdnService.initialize();
        setIsInitialized(true);
        
        // Get initial stats
        const serviceStats = await filcdnService.getStats();
        setStats(serviceStats);
        
        console.log("✅ FilCDN initialized successfully", serviceStats);
      } catch (err: any) {
        console.error("❌ Failed to initialize FilCDN:", err);
        setError(`Failed to initialize FilCDN: ${err.message}`);
      } finally {
        setIsInitializing(false);
      }
    };
    
    if (!isInitialized && !isInitializing) {
      initializeFilCDN();
    }
  }, [isInitialized, isInitializing]);
  
  // Provide methods for storing and retrieving data
  const storeData = async (data: any) => {
    if (!isInitialized) {
      throw new Error("FilCDN not initialized");
    }
    
    try {
      return await filcdnService.storeData(data);
    } catch (err: any) {
      setError(`Failed to store data: ${err.message}`);
      throw err;
    }
  };
  
  const retrieveData = async (cid: string) => {
    if (!isInitialized) {
      throw new Error("FilCDN not initialized");
    }
    
    try {
      return await filcdnService.retrieveData(cid);
    } catch (err: any) {
      setError(`Failed to retrieve data: ${err.message}`);
      throw err;
    }
  };
  
  const getCDNUrl = async (cid: string) => {
    if (!isInitialized) {
      throw new Error("FilCDN not initialized");
    }
    
    try {
      return await filcdnService.getCDNUrl(cid);
    } catch (err: any) {
      setError(`Failed to get CDN URL: ${err.message}`);
      throw err;
    }
  };
  
  // Return context value that would be provided to consumers
  return {
    isInitialized,
    isInitializing,
    error,
    stats,
    storeData,
    retrieveData,
    getCDNUrl,
    clearError: () => setError(null),
    reInitialize: async () => {
      setIsInitialized(false);
      await filcdnService.initialize();
    }
  };
}

/**
 * Integration with Server-Side API
 *
 * This shows how to implement the server-side API for FilCDN operations
 * to keep private keys secure on the server.
 */
function serverApiImplementationExample() {
  // This would go in frontend/src/app/api/filcdn/route.ts
  
  // Environment variables on server side
  const FILECOIN_PRIVATE_KEY = process.env.FILECOIN_PRIVATE_KEY;
  const FILECOIN_RPC_URL = process.env.FILECOIN_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';
  
  // Create FilCDN service instance with private key
  const filcdnService = createRealFilCDNService({
    privateKey: FILECOIN_PRIVATE_KEY,
    rpcURL: FILECOIN_RPC_URL,
    withCDN: true
  });
  
  // Initialize service (can be done once and cached)
  let serviceInitialized = false;
  
  async function ensureServiceInitialized() {
    if (!serviceInitialized) {
      await filcdnService.initialize();
      serviceInitialized = true;
    }
  }
  
  // Handle API operations
  async function handleOperation(operation: string, data: any): Promise<any> {
    await ensureServiceInitialized();
    
    switch (operation) {
      case 'store':
        const result = await filcdnService.storeData(data);
        return {
          success: true,
          result: {
            cid: result.cid,
            size: result.size,
            url: result.url,
            timestamp: result.timestamp
          }
        };
        
      case 'retrieve':
        const { cid } = data;
        if (!cid) {
          throw new Error('Missing CID for retrieval');
        }
        
        const retrievalResult = await filcdnService.retrieveData(cid);
        return {
          success: true,
          result: retrievalResult
        };
        
      case 'getStats':
        const stats = await filcdnService.getStats();
        return {
          success: true,
          result: stats
        };
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
  
  // This is just a pseudocode example, not actual API implementation
  return { handleOperation };
}

/**
 * Implementation Roadmap
 *
 * Based on our testing and examples, here's how to integrate FilCDN:
 *
 * 1. Update .env.example with required variables:
 *    - FILECOIN_PRIVATE_KEY (server-side only)
 *    - NEXT_PUBLIC_FILECOIN_RPC_URL
 *    - NEXT_PUBLIC_FILCDN_ENABLED
 *    - NEXT_PUBLIC_USE_REAL_FILCDN
 *
 * 2. Update the server-side API:
 *    - Replace mock implementation in route.ts with real FilCDN service
 *    - Add proper error handling and security
 *
 * 3. Update FilCDNContext.tsx:
 *    - Use the createFilCDNService factory to determine whether to use mock or real implementation
 *    - Keep private key handling server-side only
 *
 * 4. Update components:
 *    - Ensure FilCDNDemo.tsx works with the real implementation
 *    - Add proper loading states and error handling
 *    - Display performance metrics
 *
 * 5. Add to existing features:
 *    - Use FilCDN for event content storage
 *    - Use FilCDN for performer profile storage
 *    - Use FilCDN for bounty submission storage
 */

// Export for demonstration purposes
export { exampleUsage, serverApiImplementationExample };