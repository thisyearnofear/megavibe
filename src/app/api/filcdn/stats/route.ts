import { NextResponse } from "next/server";
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

    // Get stats from FilCDN service
    const stats = await filcdnService.getStats();
    
    // Filter out sensitive information
    const safeStats = {
      network: stats.network,
      withCDN: stats.withCDN,
      initialized: isInitialized,
      proofSetId: stats.proofSetId,
      lastUpdated: stats.lastUpdated,
      providerPdpUrl: stats.provider?.pdpUrl || null,
      providerSpeed: stats.provider?.speed || null
    };
    
    return NextResponse.json(safeStats);
  } catch (err: any) {
    console.error("Error getting FilCDN stats:", err);
    
    return NextResponse.json(
      { 
        error: `Failed to get FilCDN stats: ${err.message}`,
        initialized: false,
        lastUpdated: Date.now()
      },
      { status: 500 }
    );
  }
}