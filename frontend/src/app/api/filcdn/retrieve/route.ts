import { NextRequest, NextResponse } from "next/server";
import { createRealFilCDNService } from "@/services/filcdn/realFilcdnService";

// Initialize FilCDN service with private key from server environment
const filcdnService = createRealFilCDNService({
  privateKey: process.env.FILCDN_PRIVATE_KEY || process.env.FILECOIN_PRIVATE_KEY || process.env.PRIVATE_KEY,
  rpcURL: process.env.NEXT_PUBLIC_FILECOIN_RPC_URL || "https://api.calibration.node.glif.io/rpc/v1",
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
      } catch (err: any) {
        console.error("Failed to initialize FilCDN service:", err);
        initError = err.message;
        throw err;
      }
    })();
  }
  
  await initializationPromise;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await ensureInitialized();

    // Get CID from query parameter using nextUrl (static-friendly)
    const { searchParams } = req.nextUrl;
    const cid = searchParams.get('cid');
    const format = searchParams.get('format') || 'json';

    if (!cid) {
      return NextResponse.json(
        { error: "CID parameter is required" },
        { status: 400 }
      );
    }

    // Clean the CID to avoid issues
    const cleanCid = cid.trim();
    console.log(`Processing retrieval request for CID: ${cleanCid}`);

    try {
      console.log(`Attempting to retrieve data from FilCDN for CID: ${cleanCid}`);
      
      // Retrieve data from FilCDN
      const result = await filcdnService.retrieveData(cleanCid);
      
      if (!result || !result.data) {
        console.error(`No data returned from FilCDN for CID: ${cleanCid}`);
        return NextResponse.json(
          { error: 'Failed to retrieve data from FilCDN - empty result' },
          { status: 404 }
        );
      }
      
      console.log(`Successfully retrieved data for CID: ${cleanCid}, mimeType: ${result.mimeType}`);
      
      // Determine if this is an image from mime type or requested format
      if (format === 'image' ||
          (result.mimeType && result.mimeType.startsWith('image/'))) {
        
        console.log(`Returning image data for CID: ${cleanCid}`);
        
        // For images, return the content directly with appropriate mime type
        if (result.data) {
          // Check if data is base64 and starts with data URL
          if (typeof result.data === 'string' && result.data.startsWith('data:')) {
            // Extract content after base64 part
            const base64Data = result.data.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Get content type from data URL or use provided one
            const mimeType = result.data.split(';')[0].split(':')[1] ||
                              result.mimeType || 'image/webp';
            
            // Return binary data with correct content type
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000',
              }
            });
          }
          
          // If it's already a Buffer or other format
          return NextResponse.json(result);
        }
      }
      
      // For non-images or if direct return failed, use JSON
      return NextResponse.json(result);
    } catch (retrievalError: any) {
      console.error(`Retrieval error for CID ${cleanCid}:`, retrievalError);
      
      // Try to get a gateway URL as fallback
      try {
        const gatewayUrl = await filcdnService.getCDNUrl(cleanCid);
        
        // Redirect to gateway instead
        console.log(`Redirecting to gateway URL: ${gatewayUrl}`);
        return NextResponse.redirect(gatewayUrl, { status: 307 });
      } catch (gatewayError) {
        // If gateway fallback also fails, return the original error
        console.error("Gateway fallback also failed:", gatewayError);
        throw retrievalError;
      }
    }
  } catch (err: any) {
    console.error("Error retrieving data from FilCDN:", err);
    
    return NextResponse.json(
      { error: `Failed to retrieve data from FilCDN: ${err.message}` },
      { status: 500 }
    );
  }
}