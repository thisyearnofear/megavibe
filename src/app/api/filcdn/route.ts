import { NextRequest, NextResponse } from "next/server";
import { createRealFilCDNService } from "@/services/filcdn/realFilcdnService";

// Initialize FilCDN service with private key from server environment
const privateKey = process.env.FILCDN_PRIVATE_KEY || 
                  process.env.FILECOIN_PRIVATE_KEY || 
                  process.env.PRIVATE_KEY;

const rpcURL = process.env.NEXT_PUBLIC_FILECOIN_RPC_URL || 
              "https://api.calibration.node.glif.io/rpc/v1";

// Validate environment variables
if (!privateKey) {
  console.warn("⚠️ No FilCDN private key found in environment variables");
}

const filcdnService = createRealFilCDNService({
  privateKey,
  rpcURL,
  withCDN: true
});

// Track initialization state
let isInitialized = false;
let initError: string | null = null;
let initializationPromise: Promise<void> | null = null;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// Initialize the service with retry logic
async function ensureInitialized() {
  if (isInitialized) return;
  
  if (!initializationPromise) {
    initializationPromise = (async () => {
      while (initializationAttempts < MAX_INIT_ATTEMPTS && !isInitialized) {
        try {
          initializationAttempts++;
          console.log(`🔄 Attempting to initialize FilCDN service (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})`);
          
          // Check if we have required configuration
          if (!privateKey) {
            console.warn("⚠️ No private key found, using mock mode");
            // Don't throw error, just mark as initialized with mock mode
            isInitialized = true;
            initError = "Mock mode - no private key";
            console.log("✅ FilCDN service initialized in mock mode");
            return;
          }
          
          await filcdnService.initialize();
          isInitialized = true;
          initError = null;
          console.log("✅ FilCDN service initialized successfully on server");
          return;
        } catch (err: any) {
          const errorMessage = err.message || 'Unknown error';
          console.error(`❌ Failed to initialize FilCDN service (attempt ${initializationAttempts}):`, errorMessage);
          initError = errorMessage;
          
          // If this is the last attempt, fall back to mock mode
          if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
            console.warn(`⚠️ FilCDN initialization failed after ${MAX_INIT_ATTEMPTS} attempts, falling back to mock mode`);
            isInitialized = true;
            initError = `Mock mode - initialization failed: ${errorMessage}`;
            return;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * initializationAttempts));
        }
      }
    })();
  }
  
  await initializationPromise;
}

export async function POST(req: NextRequest) {
  try {
    console.log('📝 FilCDN API POST request received');
    
    // Ensure FilCDN service is initialized
    await ensureInitialized();
    
    // Check if we're in mock mode
    const isMockMode = initError && initError.includes('Mock mode');
    if (isMockMode) {
      console.log('🤖 Running in FilCDN mock mode');
    }
    
    // Parse request body
    const body = await req.json();
    const { operation, data } = body;
    
    // Check for required parameters
    if (!operation) {
      return NextResponse.json(
        { error: "Operation parameter is required" },
        { status: 400 }
      );
    }
    
    // Handle different operations
    switch (operation) {
      case "store": {
        if (!data) {
          return NextResponse.json(
            { error: "Data parameter is required for store operation" },
            { status: 400 }
          );
        }
        
        // Extract data for storage
        const { name, type, content, prompt, timestamp } = data;
        
        if (!content) {
          return NextResponse.json(
            { error: "Content is required for storage" },
            { status: 400 }
          );
        }
        
        // If content is base64, decode it
        let dataToStore: any;
        
        if (typeof content === 'string' && content.startsWith('data:')) {
          // Handle data URL format
          const matches = content.match(/^data:([^;]+);base64,(.+)$/);
          
          if (!matches) {
            return NextResponse.json(
              { error: "Invalid data URL format" },
              { status: 400 }
            );
          }
          
          const mimeType = matches[1];
          const base64Data = matches[2];
          
          // Store metadata with content
          dataToStore = {
            name: name || `file-${Date.now()}`,
            type: type || mimeType,
            content: base64Data,
            prompt,
            timestamp: timestamp || Date.now()
          };
        } else {
          // Store as-is
          dataToStore = data;
        }
        
        // Store data on FilCDN or return mock response
        let result;
        if (isMockMode) {
          // Mock response for development
          result = {
            cid: `mock_cid_${Date.now()}`,
            size: JSON.stringify(dataToStore).length,
            url: `https://ipfs.io/ipfs/mock_cid_${Date.now()}`,
            timestamp: Date.now()
          };
          console.log('🤖 Mock FilCDN store response:', result);
        } else {
          result = await filcdnService.storeData(dataToStore);
        }
        
        return NextResponse.json({
          status: "success",
          operation: "store",
          result,
          mockMode: isMockMode
        });
      }
      
      case "retrieve": {
        if (!data || !data.cid) {
          return NextResponse.json(
            { error: "CID parameter is required for retrieve operation" },
            { status: 400 }
          );
        }
        
        // Retrieve data from FilCDN or return mock response
        let result;
        if (isMockMode) {
          // Mock response for development
          result = {
            data: { message: 'Mock data for CID: ' + data.cid },
            mimeType: 'application/json'
          };
          console.log('🤖 Mock FilCDN retrieve response:', result);
        } else {
          result = await filcdnService.retrieveData(data.cid);
        }
        
        return NextResponse.json({
          status: "success",
          operation: "retrieve",
          result,
          mockMode: isMockMode
        });
      }
      
      case "getCDNUrl": {
        if (!data || !data.cid) {
          return NextResponse.json(
            { error: "CID parameter is required for getCDNUrl operation" },
            { status: 400 }
          );
        }
        
        // Get CDN URL or return mock response
        let url;
        if (isMockMode) {
          // Mock response for development
          url = `https://ipfs.io/ipfs/${data.cid}`;
          console.log('🤖 Mock FilCDN CDN URL:', url);
        } else {
          url = await filcdnService.getCDNUrl(data.cid);
        }
        
        return NextResponse.json({
          status: "success",
          operation: "getCDNUrl",
          result: { url },
          mockMode: isMockMode
        });
      }
      
      case "getStats": {
        // Get stats or return mock response
        let stats;
        if (isMockMode) {
          // Mock response for development
          stats = {
            initialized: true,
            mockMode: true,
            network: 'calibration',
            lastUpdated: Date.now()
          };
          console.log('🤖 Mock FilCDN stats:', stats);
        } else {
          stats = await filcdnService.getStats();
        }
        
        return NextResponse.json({
          status: "success",
          operation: "getStats",
          result: stats,
          mockMode: isMockMode
        });
      }
      
      default:
        return NextResponse.json(
          { error: `Unsupported operation: ${operation}` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    const errorMessage = err.message || 'Unknown error';
    console.error("❌ FilCDN API error:", {
      message: errorMessage,
      stack: err.stack,
      initialized: isInitialized,
      attempts: initializationAttempts
    });
    
    return NextResponse.json(
      {
        status: "error",
        message: errorMessage,
        initialized: isInitialized,
        attempts: initializationAttempts,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('🔍 FilCDN API health check requested');
    
    // Get detailed service status
    let status: any = {
      status: isInitialized ? "operational" : "initializing",
      initialized: isInitialized,
      error: initError,
      attempts: initializationAttempts,
      maxAttempts: MAX_INIT_ATTEMPTS,
      timestamp: new Date().toISOString(),
      environment: {
        hasPrivateKey: !!privateKey,
        rpcURL: rpcURL,
        nodeEnv: process.env.NODE_ENV
      }
    };
    
    // If not initialized, try to get more details
    if (!isInitialized && filcdnService) {
      try {
        const stats = await filcdnService.getStats();
        status.stats = stats;
      } catch (statsErr: any) {
        status.statsError = statsErr.message;
      }
    }
    
    return NextResponse.json(status);
  } catch (err: any) {
    console.error('❌ FilCDN health check error:', err);
    return NextResponse.json(
      { 
        status: "error", 
        message: err.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}