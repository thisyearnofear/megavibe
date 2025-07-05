import { NextRequest, NextResponse } from "next/server";
import { createRealFilCDNService } from "@/services/filcdn/realFilcdnService";

// Initialize FilCDN service with private key from server environment
const privateKey = process.env.FILCDN_PRIVATE_KEY || 
                  process.env.FILECOIN_PRIVATE_KEY || 
                  process.env.PRIVATE_KEY;

const rpcURL = process.env.NEXT_PUBLIC_FILECOIN_RPC_URL || 
              "https://api.calibration.node.glif.io/rpc/v1";

const filcdnService = createRealFilCDNService({
  privateKey,
  rpcURL,
  withCDN: true
});

// Track initialization state
let isInitialized = false;
let initError: string | null = null;
let initializationPromise: Promise<void> | null = null;

// Initialize the service
async function ensureInitialized() {
  if (isInitialized) return;
  
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        await filcdnService.initialize();
        isInitialized = true;
        initError = null;
        console.log("✅ FilCDN service initialized successfully on server");
      } catch (err: any) {
        console.error("❌ Failed to initialize FilCDN service:", err);
        initError = err.message;
        throw err;
      }
    })();
  }
  
  await initializationPromise;
}

export async function POST(req: NextRequest) {
  try {
    // Ensure FilCDN service is initialized
    await ensureInitialized();
    
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
    console.error("FilCDN API error:", err);
    
    return NextResponse.json(
      {
        status: "error",
        message: err.message,
        initialized: isInitialized
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return service status
    return NextResponse.json({
      status: "operational",
      initialized: isInitialized,
      error: initError
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}