import { NextResponse } from "next/server";
import { createRealFilCDNService } from "@/services/filcdn/realFilcdnService";

// Initialize FilCDN service with private key from server environment
const filcdnService = createRealFilCDNService({
  privateKey: process.env.FILCDN_PRIVATE_KEY || process.env.FILECOIN_PRIVATE_KEY || process.env.PRIVATE_KEY,
  rpcURL: process.env.NEXT_PUBLIC_FILECOIN_RPC_URL || "https://api.calibration.node.glif.io/rpc/v1",
  withCDN: true
});

// Track initialization state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Initialize the service
async function ensureInitialized() {
  if (isInitialized) return;
  
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        await filcdnService.initialize();
        isInitialized = true;
      } catch (err: unknown) {
        console.error("Failed to initialize FilCDN service:", err);
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
  } catch (err: unknown) {
    let message = "Unknown error";
    if (typeof err === "object" && err && "message" in err) {
      message = (err as { message?: string }).message || message;
    }
    return NextResponse.json(
      { 
        status: "error", 
        message: `FilCDN initialization failed: ${message}`,
        initialized: false
      },
      { status: 500 }
    );
  }
}