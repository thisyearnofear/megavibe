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

export async function POST(req: NextRequest) {
  try {
    await ensureInitialized();

    // Parse request body
    const body = await req.json();
    const { data, format = 'json' } = body;

    if (!data) {
      return NextResponse.json(
        { error: "No data provided for storage" },
        { status: 400 }
      );
    }

    // Convert data based on format
    let dataToStore: any;
    
    if (format === 'binary') {
      // Convert base64 back to binary
      const binaryString = atob(data);
      dataToStore = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        dataToStore[i] = binaryString.charCodeAt(i);
      }
    } else if (format === 'text') {
      dataToStore = data;
    } else {
      // Default to JSON
      dataToStore = typeof data === 'string' ? JSON.parse(data) : data;
    }

    // Store data on FilCDN
    const result = await filcdnService.storeData(dataToStore);
    
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error storing data on FilCDN:", err);
    
    return NextResponse.json(
      { error: `Failed to store data on FilCDN: ${err.message}` },
      { status: 500 }
    );
  }
}