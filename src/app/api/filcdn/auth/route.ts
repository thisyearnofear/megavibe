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

export async function GET() {
  try {
    await ensureInitialized();
    
    // Get service stats
    const stats = await filcdnService.getStats();
    
    // Return status and authentication token for client
    // Note: We don't return any sensitive information
    return NextResponse.json({
      status: "authenticated",
      initialized: isInitialized,
      stats: {
        network: stats.network,
        withCDN: stats.withCDN,
        proofSetId: stats.proofSetId,
        lastUpdated: stats.lastUpdated
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { 
        status: "error", 
        message: `FilCDN initialization failed: ${err.message}`,
        initialized: false
      },
      { status: 500 }
    );
  }
}