/**
 * Production-ready Synapse SDK implementation
 * Handles environment-based SDK loading with proper fallbacks
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTestEnvironment = process.env.NEXT_PUBLIC_USE_MOCK_SDK === 'true';
const isStorybook = process.env.NODE_ENV === 'test' || typeof window !== 'undefined' && (window as any).__STORYBOOK_ADDONS__;

// Type definitions for better TypeScript support
export interface SynapseConfig {
  network?: string;
  rpcUrl?: string;
  privateKey?: string;
  mnemonic?: string;
}

export interface StorageUploadResult {
  commp: {
    toString: () => string;
  };
}

export interface StorageService {
  upload(data: Uint8Array): Promise<StorageUploadResult>;
  providerDownload(cid: string, options?: any): Promise<Uint8Array>;
}

export interface PandoraService {
  checkAllowanceForStorage(
    dataSize: number, 
    withCDN: boolean, 
    payments: any
  ): Promise<{
    sufficient: boolean;
    lockupAllowanceNeeded: bigint;
    rateAllowanceNeeded: bigint;
  }>;
}

export interface SynapseInstance {
  payments: {
    deposit: (amount: bigint, token?: any, callbacks?: any) => Promise<any>;
    approveService: (address: string, rate: bigint, amount: bigint, token?: any) => Promise<any>;
    balance: () => Promise<bigint>;
  };
  getNetwork(): string;
  getSigner(): any;
  createStorage(options: {
    callbacks?: {
      onProviderSelected?: (provider: any) => void;
      onProofSetResolved?: (info: any) => void;
      onProofSetCreationStarted?: (transaction: any, statusUrl: any) => void;
      onProofSetCreationProgress?: (progress: any) => void;
    }
  }): Promise<StorageService>;
}

export interface SynapseConstructor {
  create(config: SynapseConfig): Promise<SynapseInstance>;
}

// Environment-based SDK loading
async function loadSynapseSDK(): Promise<{
  Synapse: SynapseConstructor;
  RPC_URLS: any;
  TOKENS: any;
  CONTRACT_ADDRESSES: any;
  StorageService: any;
  PandoraService: any;
}> {
  // Use mock in development, testing, or when explicitly requested
  if (isDevelopment || isTestEnvironment || isStorybook) {
    console.log('🔧 Using mock Synapse SDK for development/testing');
    const mockSDK = await import('./mockSynapseSDK');
    return {
      Synapse: mockSDK.Synapse as any,
      RPC_URLS: mockSDK.RPC_URLS,
      TOKENS: mockSDK.TOKENS,
      CONTRACT_ADDRESSES: mockSDK.CONTRACT_ADDRESSES,
      StorageService: mockSDK.StorageService as any,
      PandoraService: mockSDK.PandoraService as any,
    };
  }

  // Production: Try to load the real SDK
  try {
    console.log('🚀 Loading production Synapse SDK');
    const realSDK = await import('@filoz/synapse-sdk');

    // Validate that the SDK has the expected exports
    if (!realSDK.Synapse) {
      throw new Error('Invalid SDK: Missing Synapse export');
    }

    return {
      Synapse: realSDK.Synapse,
      RPC_URLS: realSDK.RPC_URLS || {},
      TOKENS: realSDK.TOKENS || {},
      CONTRACT_ADDRESSES: realSDK.CONTRACT_ADDRESSES || {},
      StorageService: realSDK.StorageService || (() => ({})),
      PandoraService: realSDK.PandoraService || (() => ({})),
    };
  } catch (error) {
    console.error('❌ Failed to load production Synapse SDK:', error);

    // In production, this should be a hard failure
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Production Synapse SDK failed to load. This is a critical error that prevents the application from functioning properly.'
      );
    }

    // Fallback to mock with warning for non-production environments
    console.warn('⚠️ Falling back to mock SDK. This should not happen in production!');
    const mockSDK = await import('./mockSynapseSDK');
    return {
      Synapse: mockSDK.Synapse as any,
      RPC_URLS: mockSDK.RPC_URLS,
      TOKENS: mockSDK.TOKENS,
      CONTRACT_ADDRESSES: mockSDK.CONTRACT_ADDRESSES,
      StorageService: mockSDK.StorageService as any,
      PandoraService: mockSDK.PandoraService as any,
    };
  }
}

// Create a singleton instance to avoid multiple loads
let sdkPromise: Promise<any> | null = null;

export function getSynapseSDK() {
  if (!sdkPromise) {
    sdkPromise = loadSynapseSDK();
  }
  return sdkPromise;
}

// Export the SDK components - these will be available after calling getSynapseSDK()
// Note: We can't use top-level await in Next.js, so these are exported as functions
export async function getSynapse() {
  const sdk = await getSynapseSDK();
  return sdk.Synapse;
}

export async function getRPCUrls() {
  const sdk = await getSynapseSDK();
  return sdk.RPC_URLS;
}

export async function getTokens() {
  const sdk = await getSynapseSDK();
  return sdk.TOKENS;
}

export async function getContractAddresses() {
  const sdk = await getSynapseSDK();
  return sdk.CONTRACT_ADDRESSES;
}

export async function getStorageService() {
  const sdk = await getSynapseSDK();
  return sdk.StorageService;
}

export async function getPandoraService() {
  const sdk = await getSynapseSDK();
  return sdk.PandoraService;
}

// Health check function for the SDK
export async function checkSDKHealth(): Promise<{
  healthy: boolean;
  version?: string;
  network?: string;
  error?: string;
}> {
  try {
    const sdk = await getSynapseSDK();
    
    // Basic health check - try to create a Synapse instance
    const instance = await sdk.Synapse.create({
      network: 'calibration'
    });
    
    return {
      healthy: true,
      network: instance.getNetwork(),
      version: 'unknown' // SDK might not expose version
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Utility function to check if we're using the mock SDK
export function isMockSDK(): boolean {
  return isDevelopment || isTestEnvironment || isStorybook;
}

// All types are already exported as interfaces above