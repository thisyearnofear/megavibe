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
            throw new Error("Missing required environment variable: FILCDN_PRIVATE_KEY, FILECOIN_PRIVATE_KEY, or PRIVATE_KEY");
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
          
          // If this is the last attempt, throw the error
          if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
            throw new Error(`Failed to initialize FilCDN service after ${MAX_INIT_ATTEMPTS} attempts: ${errorMessage}`);
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
    try {
      await ensureInitialized();
    } catch (initErr: any) {
      console.error('❌ FilCDN initialization failed:', initErr);
      return NextResponse.json(
        {
          status: "error",
          message: "FilCDN service initialization failed",
          details: initErr.message,
          initialized: false,
          attempts: initializationAttempts
        },
        { status: 503 } // Service Unavailable
      );
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
        
        // Store data on FilCDN
        const result = await filcdnService.storeData(dataToStore);
        
        return NextResponse.json({
          status: "success",
          operation: "store",
          result
        });
      }
      
      case "retrieve": {
        if (!data || !data.cid) {
          return NextResponse.json(
            { error: "CID parameter is required for retrieve operation" },
            { status: 400 }
          );
        }
        
        // Retrieve data from FilCDN
        const result = await filcdnService.retrieveData(data.cid);
        
        return NextResponse.json({
          status: "success",
          operation: "retrieve",
          result
        });
      }
      
      case "getCDNUrl": {
        if (!data || !data.cid) {
          return NextResponse.json(
            { error: "CID parameter is required for getCDNUrl operation" },
            { status: 400 }
          );
        }
        
        // Get CDN URL
        const url = await filcdnService.getCDNUrl(data.cid);
        
        return NextResponse.json({
          status: "success",
          operation: "getCDNUrl",
          result: { url }
        });
      }
      
      case "getStats": {
        // Get stats
        const stats = await filcdnService.getStats();
        
        return NextResponse.json({
          status: "success",
          operation: "getStats",
          result: stats
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
    const status = {
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