import { NextResponse } from "next/server";

export async function GET() {
  try {
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextVersion: process.env.npm_package_version || "unknown",
      },
      services: {
        filcdn: {
          enabled: process.env.NEXT_PUBLIC_FILCDN_ENABLED === 'true',
          hasPrivateKey: !!(
            process.env.FILCDN_PRIVATE_KEY || 
            process.env.FILECOIN_PRIVATE_KEY || 
            process.env.PRIVATE_KEY
          ),
          rpcUrl: process.env.NEXT_PUBLIC_FILECOIN_RPC_URL || "default",
        },
        ai: {
          enabled: process.env.NEXT_PUBLIC_AI_ENABLED === 'true',
          hasApiKey: !!process.env.VENICE_API_KEY,
        },
        blockchain: {
          mantleRpcUrl: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || "default",
          chainId: process.env.NEXT_PUBLIC_MANTLE_CHAIN_ID || "default",
        }
      },
      contracts: {
        tipping: process.env.NEXT_PUBLIC_TIPPING_CONTRACT_ADDRESS || "not set",
        bounty: process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ADDRESS || "not set",
      }
    };

    return NextResponse.json(healthStatus);
  } catch (error: any) {
    console.error('❌ Health check error:', error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}