/**
 * Real FilCDN Service
 * Properly implements FilCDN integration using the Synapse SDK
 */

import { getSynapseSDK, isMockSDK, getContractAddresses, getRPCUrls } from './synapseSDK';
import type { SynapseInstance, StorageService, PandoraService } from './synapseSDK';
import { ethers } from 'ethers';

// Constants
const PROOF_SET_CREATION_FEE = ethers.parseUnits('5', 18); // 5 USDFC for proof set
const BUFFER_AMOUNT = ethers.parseUnits('5', 18); // 5 USDFC buffer for gas fees

// Service configuration interface
export interface FilCDNConfig {
  privateKey?: string;
  rpcURL?: string;
  authorization?: string; // For API key authentication
  withCDN?: boolean;
}

// Storage result interface
export interface StorageResult {
  cid: string;
  size: number;
  url: string;
  timestamp: number;
}

// Retrieval result interface
export interface RetrievalResult {
  data: unknown;
  mimeType: string;
}

// Provider information interface
export interface ProviderInfo {
  owner: string;
  pdpUrl: string;
  speed: number;
}

/**
 * Real FilCDN Service class
 * Provides functionality for interacting with FilCDN via Synapse SDK
 */
export class RealFilCDNService {
  private synapse: SynapseInstance | null = null;
  private storage: StorageService | null = null;
  private initialized: boolean = false;
  private initializing: boolean = false;
  private providerInfo: ProviderInfo | null = null;
  private proofSetId: number | null = null;
  private stats: Record<string, unknown> = {};
  
  constructor(private config: FilCDNConfig = {}) {}

  /**
   * Performs preflight checks to ensure sufficient USDFC balance and allowances
   * @param dataSize Size of data to be stored
   * @param withProofset Whether a new proofset needs to be created
   */
  private async performPreflightCheck(dataSize: number, withProofset: boolean): Promise<void> {
    if (!this.synapse) {
      throw new Error("Synapse not initialized");
    }
    
    // Skip preflight checks in mock mode
    if (isMockSDK()) {
      console.log('🤖 Skipping preflight check in mock mode');
      return;
    }
    
    try {
      const sdk = await getSynapseSDK();
      const contractAddresses = await getContractAddresses();
      const network = this.synapse.getNetwork();
      const pandoraAddress = (contractAddresses as any).PANDORA_SERVICE?.[network];
      
      if (!pandoraAddress) {
        console.warn(`⚠️ No Pandora service address found for network: ${network}`);
        return;
      }
      
      const signer = this.synapse.getSigner();
      if (!signer || !(signer as any).provider) {
        throw new Error("Provider not found");
      }
      
      // Initialize Pandora service for allowance checks
      const pandoraService = new (sdk as any).PandoraService(
        (signer as any).provider,
        pandoraAddress
      );

      // Check if current allowance is sufficient
      const preflight = await pandoraService.checkAllowanceForStorage(
        dataSize,
        this.config.withCDN || false,
        this.synapse.payments
      );

      // If allowance is insufficient, handle deposit and approval
      if (!preflight.sufficient) {
        // Calculate total allowance needed including proofset creation fee if required
        const proofSetCreationFee = withProofset ? PROOF_SET_CREATION_FEE : BigInt(0);
        const allowanceNeeded = preflight.lockupAllowanceNeeded + proofSetCreationFee + BUFFER_AMOUNT;

        console.log('💰 Setting up USDFC payments:');
        console.log('- Base allowance:', ethers.formatUnits(preflight.lockupAllowanceNeeded, 18), 'USDFC');
        if (withProofset) {
          console.log('- Proof set fee:', ethers.formatUnits(PROOF_SET_CREATION_FEE, 18), 'USDFC');
        }
        console.log('- Buffer amount:', ethers.formatUnits(BUFFER_AMOUNT, 18), 'USDFC');
        console.log('- Total needed:', ethers.formatUnits(allowanceNeeded, 18), 'USDFC');

        // Step 1: Deposit USDFC to cover storage costs
        console.log('💳 Depositing USDFC...');
        await this.synapse.payments.deposit(allowanceNeeded);
        console.log('✅ USDFC deposited successfully');

        // Step 2: Approve Pandora service to spend USDFC at specified rates
        console.log('✅ Approving Pandora service...');
        await this.synapse.payments.approveService(
          pandoraAddress,
          preflight.rateAllowanceNeeded,
          allowanceNeeded
        );
        console.log('✅ Pandora service approved successfully');
      } else {
        console.log('✓ Sufficient USDFC allowance already available');
      }
    } catch (error) {
      console.error('❌ Preflight check failed:', error);
      throw error;
    }
  }

  /**
   * Initialize the FilCDN service with Synapse SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) {
      // Wait for initialization to complete
      let retries = 0;
      while (this.initializing && retries < 30) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }
      if (this.initialized) return;
      throw new Error("Initialization timed out");
    }
    
    this.initializing = true;
    
    try {
      console.log("🔄 Initializing FilCDN service with Synapse SDK");
      
      // Validate configuration
      if (!this.config.privateKey) {
        throw new Error("Private key is required for FilCDN initialization");
      }
      
      // Get SDK instance with error handling
      let sdk;
      try {
        sdk = await getSynapseSDK();
      } catch (sdkError) {
        console.error('❌ Failed to load Synapse SDK:', sdkError);
        throw new Error(`Failed to load Synapse SDK: ${sdkError instanceof Error ? sdkError.message : 'Unknown error'}`);
      }
      
      const rpcUrls = await getRPCUrls();

      // Log if we're using mock SDK
      if (isMockSDK()) {
        console.warn("⚠️ Using mock Synapse SDK - not suitable for production");
      }

      // Initialize Synapse SDK with timeout
      console.log('🔗 Creating Synapse instance...');
      try {
        this.synapse = await Promise.race([
          sdk.Synapse.create({
            privateKey: this.config.privateKey,
            rpcUrl: this.config.rpcURL || (rpcUrls as any).calibration?.websocket || 'https://api.calibration.node.glif.io/rpc/v1'
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Synapse initialization timeout')), 30000)
          )
        ]) as any;
      } catch (synapseError) {
        console.error('❌ Failed to create Synapse instance:', synapseError);
        throw new Error(`Failed to create Synapse instance: ${synapseError instanceof Error ? synapseError.message : 'Unknown error'}`);
      }

      if (!this.synapse) {
        throw new Error("Synapse instance not created");
      }

      console.log('✅ Synapse instance created successfully');

      // Skip preflight check in mock mode
      if (!isMockSDK()) {
        try {
          console.log('🔍 Performing preflight check...');
          await this.performPreflightCheck(1024, true); // 1KB minimum size
          console.log('✅ Preflight check completed');
        } catch (preflightError) {
          console.warn('⚠️ Preflight check failed, continuing anyway:', preflightError);
          // Don't fail initialization for preflight issues
        }
      }

      // Create storage service with callbacks
      console.log('💾 Creating storage service...');
      try {
        this.storage = await this.synapse.createStorage({
          callbacks: {
            onProviderSelected: (provider: any) => {
              console.log(`✓ Selected storage provider: ${(provider as any).owner}`);
              console.log(`  PDP URL: ${(provider as any).pdpUrl}`);
              this.providerInfo = {
                owner: (provider as any).owner,
                pdpUrl: (provider as any).pdpUrl,
                speed: 0 // Will be updated later
              };
            },
            onProofSetResolved: (info: any) => {
              if ((info as any).isExisting) {
                console.log(`✓ Using existing proof set: ${(info as any).proofSetId}`);
              } else {
                console.log(`✓ Created new proof set: ${(info as any).proofSetId}`);
              }
              this.proofSetId = (info as any).proofSetId;
            },
            onProofSetCreationStarted: (transaction: any, statusUrl: any) => {
              console.log(`  Creating proof set, tx: ${(transaction as any).hash}`);
            },
            onProofSetCreationProgress: (progress: any) => {
              if ((progress as any).transactionMined && !(progress as any).proofSetLive) {
                console.log('  Transaction mined, waiting for proof set to be live...');
              }
            },
          },
        });
      } catch (storageError) {
        console.error('❌ Failed to create storage service:', storageError);
        throw new Error(`Failed to create storage service: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
      }
      
      // Update stats
      this.stats = {
        network: this.synapse.getNetwork(),
        provider: this.providerInfo,
        proofSetId: this.proofSetId,
        withCDN: this.config.withCDN,
        initialized: true,
        lastUpdated: Date.now(),
        isMock: isMockSDK(),
        sdkVersion: 'unknown' // Could be enhanced to get actual version
      };
      
      this.initialized = true;
      console.log("✅ FilCDN service initialized successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FilCDN service initialization failed:', {
        message,
        stack: error instanceof Error ? error.stack : undefined,
        config: {
          hasPrivateKey: !!this.config.privateKey,
          rpcURL: this.config.rpcURL,
          withCDN: this.config.withCDN
        }
      });
      throw new Error(`Failed to initialize FilCDN service: ${message}`);
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Store data on FilCDN
   * @param data Data to store
   * @returns Storage result
   */
  async storeData(data: unknown): Promise<StorageResult> {
    if (!this.initialized || !this.storage) {
      await this.initialize();
    }
    
    try {
      console.log("💾 Storing data on FilCDN");
      
      // Convert data to Uint8Array for storage
      let dataToStore: Uint8Array;
      
      if (data instanceof Uint8Array) {
        dataToStore = data;
      } else if (typeof data === 'string') {
        dataToStore = new TextEncoder().encode(data);
      } else {
        dataToStore = new TextEncoder().encode(JSON.stringify(data));
      }
      
      console.log(`📄 Data size: ${dataToStore.length} bytes`);
      
      // Skip preflight check in mock mode
      if (!isMockSDK()) {
        try {
          await this.performPreflightCheck(dataToStore.length, false);
        } catch (preflightError) {
          console.warn('⚠️ Preflight check failed, continuing anyway:', preflightError);
        }
      }
      
      // Upload data to FilCDN
      const result = await this.storage!.upload(dataToStore);
      
      // Get CDN URL
      const url = await this.getCDNUrl(result.commp.toString());
      
      console.log(`✅ Data stored successfully with CID: ${result.commp.toString()}`);
      
      // Return storage result
      return {
        cid: result.commp.toString(),
        size: dataToStore.length,
        url,
        timestamp: Date.now()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FilCDN storage failed:', {
        message,
        stack: error instanceof Error ? error.stack : undefined,
        dataSize: data ? (typeof data === 'string' ? data.length : JSON.stringify(data).length) : 0
      });
      throw new Error(`Failed to store data on FilCDN: ${message}`);
    }
  }

  /**
   * Retrieve data from FilCDN
   * @param cid Content identifier
   * @returns Retrieval result
   */
  async retrieveData(cid: string): Promise<RetrievalResult> {
    if (!this.initialized || !this.storage) {
      await this.initialize();
    }
    
    try {
      console.log(`📝 Retrieving data from FilCDN for CID: ${cid}`);
      
      // Download data from FilCDN
      const startTime = Date.now();
      const data = await this.storage!.providerDownload(cid);
      const endTime = Date.now();
      
      console.log(`✅ Data retrieved successfully (${data.length} bytes in ${endTime - startTime}ms)`);
      
      // Update provider speed stats if available
      if (this.providerInfo) {
        this.providerInfo.speed = Math.round(data.length / (endTime - startTime) * 1000); // bytes per second
      }
      
      // Determine MIME type based on data
      let result: unknown;
      let mimeType = 'application/octet-stream';
      
      try {
        // Try to parse as JSON
        const textData = new TextDecoder().decode(data);
        result = JSON.parse(textData);
        mimeType = 'application/json';
      } catch (e) {
        // Not JSON, return as-is
        result = data;
      }
      
      // Return retrieval result
      return {
        data: result,
        mimeType
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FilCDN retrieval failed:', {
        message,
        cid,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to retrieve data from FilCDN: ${message}`);
    }
  }

  /**
   * Get CDN URL for a content identifier
   * @param cid Content identifier
   * @returns CDN URL
   */
  async getCDNUrl(cid: string): Promise<string> {
    if (!cid) {
      throw new Error("CID is required");
    }
    
    let url: string;
    
    // If this.config.withCDN is true, use the CDN URL format
    if (this.config.withCDN) {
      // Get the provider's PDP URL if available
      if (this.providerInfo && this.providerInfo.pdpUrl) {
        url = `${this.providerInfo.pdpUrl}/ipfs/${cid}`;
      } else {
        // Fall back to FilCDN gateway
        url = `https://gateway.filcdn.io/ipfs/${cid}`;
      }
    } else {
      // Fall back to IPFS gateway
      url = `https://ipfs.io/ipfs/${cid}`;
    }
    
    console.log(`🔗 Generated CDN URL for ${cid}: ${url}`);
    return url;
  }

  /**
   * Get statistics about the FilCDN service
   * @returns Service statistics
   */
  async getStats(): Promise<Record<string, unknown>> {
    // Update timestamp
    this.stats.lastUpdated = Date.now();
    this.stats.initialized = this.initialized;
    this.stats.initializing = this.initializing;
    
    // Add balance information if available
    if (this.synapse && this.synapse.payments && !isMockSDK()) {
      try {
        const balance = await this.synapse.payments.balance();
        this.stats.balance = ethers.formatUnits(balance, 18);
      } catch (e) {
        console.warn("⚠️ Could not get balance information", e);
        this.stats.balanceError = e instanceof Error ? e.message : 'Unknown error';
      }
    }
    
    return this.stats;
  }

  /**
   * Verify that a CID exists and is retrievable
   * @param cid Content identifier to verify
   * @returns Whether the content is available
   */
  async verifyCid(cid: string): Promise<boolean> {
    if (!this.initialized || !this.storage) {
      await this.initialize();
    }
    
    try {
      console.log(`🔍 Verifying CID: ${cid}`);
      // Try to download but only verify availability
      await this.storage!.providerDownload(cid, { onlyVerify: true });
      console.log(`✅ CID verified: ${cid}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Content verification failed for CID: ${cid}`, error);
      return false;
    }
  }
}

/**
 * Create a new FilCDN service instance
 * @param config Service configuration
 * @returns FilCDN service instance
 */
export function createRealFilCDNService(config: FilCDNConfig = {}): RealFilCDNService {
  return new RealFilCDNService(config);
}