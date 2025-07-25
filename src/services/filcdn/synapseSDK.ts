/**
 * Production-ready Synapse SDK implementation
 * Handles environment-based SDK loading with proper fallbacks
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const isTestEnvironment = process.env.NEXT_PUBLIC_USE_MOCK_SDK === 'true';
const isStorybook = process.env.NODE_ENV === 'test' || typeof window !== 'undefined' && (window as unknown as { __STORYBOOK_ADDONS__?: unknown }).__STORYBOOK_ADDONS__;

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
  providerDownload(cid: string, options?: Record<string, unknown>): Promise<Uint8Array>;
}

export interface PandoraService {
  checkAllowanceForStorage(
    dataSize: number, 
    withCDN: boolean, 
    payments: unknown
  ): Promise<{
    sufficient: boolean;
    lockupAllowanceNeeded: bigint;
    rateAllowanceNeeded: bigint;
  }>;
}

export interface SynapseInstance {
  payments: {
    deposit: (amount: bigint, token?: unknown, callbacks?: unknown) => Promise<unknown>;
    approveService: (address: string, rate: bigint, amount: bigint, token?: unknown) => Promise<unknown>;
    balance: () => Promise<bigint>;
  };
  getNetwork(): string;
  getSigner(): unknown;
  createStorage(options: {
    callbacks?: {
      onProviderSelected?: (provider: unknown) => void;
      onProofSetResolved?: (info: unknown) => void;
      onProofSetCreationStarted?: (transaction: unknown, statusUrl: unknown) => void;
      onProofSetCreationProgress?: (progress: unknown) => void;
    }
  }): Promise<StorageService>;
}

export interface SynapseConstructor {
  create(config: SynapseConfig): Promise<SynapseInstance>;
}

// Environment-based SDK loading
async function loadSynapseSDK(): Promise<{
  Synapse: SynapseConstructor;
  RPC_URLS: Record<string, unknown>;
  TOKENS: Record<string, unknown>;
  CONTRACT_ADDRESSES: Record<string, unknown>;
  StorageService: unknown;
  PandoraService: unknown;
}> {
  // Use actual in development, testing, or when explicitly requested
  if (isDevelopment || isTestEnvironment || isStorybook) {
    console.log('🔧 Using actual Synapse SDK for development/testing');
    const actualSDK = await import('./actualSynapseSDK');
    return {
      Synapse: actualSDK.Synapse as SynapseConstructor,
      RPC_URLS: actualSDK.RPC_URLS,
      TOKENS: actualSDK.TOKENS,
      CONTRACT_ADDRESSES: actualSDK.CONTRACT_ADDRESSES,
      StorageService: actualSDK.StorageService,
      PandoraService: actualSDK.PandoraService,
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

    // Fallback to actual SDK with warning for non-production environments
    console.warn('⚠️ Falling back to actual SDK. This should not happen in production!');
    const actualSDK = await import('./actualSynapseSDK');
    return {
      Synapse: actualSDK.Synapse as SynapseConstructor,
      RPC_URLS: actualSDK.RPC_URLS,
      TOKENS: actualSDK.TOKENS,
      CONTRACT_ADDRESSES: actualSDK.CONTRACT_ADDRESSES,
      StorageService: actualSDK.StorageService,
      PandoraService: actualSDK.PandoraService,
    };
  }
}

// Create a singleton instance to avoid multiple loads
let sdkPromise: Promise<{
  Synapse: SynapseConstructor;
  RPC_URLS: Record<string, unknown>;
  TOKENS: Record<string, unknown>;
  CONTRACT_ADDRESSES: Record<string, unknown>;
  StorageService: unknown;
  PandoraService: unknown;
}> | null = null;

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
    console.log('SDK loaded:', sdk);
    
    // Basic health check - try to create a Synapse instance
    const instance = await sdk.Synapse.create({
      network: 'calibration'
    });
    console.log('Synapse instance created:', instance);
    
    return {
      healthy: true,
      network: instance.getNetwork(),
      version: 'unknown' // SDK might not expose version
    };
  } catch (error) {
    console.error('Error creating Synapse instance:', error);
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