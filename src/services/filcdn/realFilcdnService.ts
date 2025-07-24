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
    
    const sdk = await getSynapseSDK();
    const contractAddresses = await getContractAddresses();
    const network = this.synapse.getNetwork();
    const pandoraAddress = contractAddresses.PANDORA_SERVICE[network];
    
    const signer = this.synapse.getSigner();
    if (!signer || !signer.provider) {
      throw new Error("Provider not found");
    }
    
    // Initialize Pandora service for allowance checks
    const pandoraService = new sdk.PandoraService(
      signer.provider,
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

      console.log('Setting up USDFC payments:');
      console.log('- Base allowance:', ethers.formatUnits(preflight.lockupAllowanceNeeded, 18), 'USDFC');
      if (withProofset) {
        console.log('- Proof set fee:', ethers.formatUnits(PROOF_SET_CREATION_FEE, 18), 'USDFC');
      }
      console.log('- Buffer amount:', ethers.formatUnits(BUFFER_AMOUNT, 18), 'USDFC');
      console.log('- Total needed:', ethers.formatUnits(allowanceNeeded, 18), 'USDFC');

      // Step 1: Deposit USDFC to cover storage costs
      console.log('Depositing USDFC...');
      await this.synapse.payments.deposit(allowanceNeeded);
      console.log('USDFC deposited successfully');

      // Step 2: Approve Pandora service to spend USDFC at specified rates
      console.log('Approving Pandora service...');
      await this.synapse.payments.approveService(
        pandoraAddress,
        preflight.rateAllowanceNeeded,
        allowanceNeeded
      );
      console.log('Pandora service approved successfully');
    } else {
      console.log('✓ Sufficient USDFC allowance already available');
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
      console.log("Initializing FilCDN service with Synapse SDK");
      
      // Get SDK instance
      const sdk = await getSynapseSDK();
      const rpcUrls = await getRPCUrls();

      // Log if we're using mock SDK
      if (isMockSDK()) {
        console.warn("⚠️ Using mock Synapse SDK - not suitable for production");
      }

      // Initialize Synapse SDK
      this.synapse = await sdk.Synapse.create({
        privateKey: this.config.privateKey || "",
        rpcURL: this.config.rpcURL || rpcUrls.calibration.websocket,
        withCDN: this.config.withCDN
      });

      // Perform initial preflight check with minimum size for proof set creation
      await this.performPreflightCheck(1024, true); // 1KB minimum size

      // Create storage service with callbacks
      if (!this.synapse) {
        throw new Error("Synapse instance not initialized");
      }

      this.storage = await this.synapse.createStorage({
        callbacks: {
          onProviderSelected: (provider) => {
            console.log(`✓ Selected storage provider: ${provider.owner}`);
            console.log(`  PDP URL: ${provider.pdpUrl}`);
            this.providerInfo = {
              owner: provider.owner,
              pdpUrl: provider.pdpUrl,
              speed: 0 // Will be updated later
            };
          },
          onProofSetResolved: (info) => {
            if (info.isExisting) {
              console.log(`✓ Using existing proof set: ${info.proofSetId}`);
            } else {
              console.log(`✓ Created new proof set: ${info.proofSetId}`);
            }
            this.proofSetId = info.proofSetId;
          },
          onProofSetCreationStarted: (transaction, statusUrl) => {
            console.log(`  Creating proof set, tx: ${transaction.hash}`);
          },
          onProofSetCreationProgress: (progress) => {
            if (progress.transactionMined && !progress.proofSetLive) {
              console.log('  Transaction mined, waiting for proof set to be live...');
            }
          },
        },
      });
      
      // Update stats
      this.stats = {
        network: this.synapse.getNetwork(),
        provider: this.providerInfo,
        proofSetId: this.proofSetId,
        withCDN: this.config.withCDN,
        initialized: true,
        lastUpdated: Date.now()
      };
      
      this.initialized = true;
      console.log("✅ FilCDN service initialized successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FilCDN service initialization failed:', error);
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
      console.log("Storing data on FilCDN");
      
      // Convert data to Uint8Array for storage
      let dataToStore: Uint8Array;
      
      if (data instanceof Uint8Array) {
        dataToStore = data;
      } else if (typeof data === 'string') {
        dataToStore = new TextEncoder().encode(data);
      } else {
        dataToStore = new TextEncoder().encode(JSON.stringify(data));
      }
      
      // Perform preflight check before upload
      await this.performPreflightCheck(dataToStore.length, false);
      
      // Upload data to FilCDN
      const result = await this.storage!.upload(dataToStore);
      
      // Get CDN URL
      const url = await this.getCDNUrl(result.commp.toString());
      
      // Return storage result
      return {
        cid: result.commp.toString(),
        size: dataToStore.length,
        url,
        timestamp: Date.now()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FilCDN storage failed:', error);
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
      console.log(`Retrieving data from FilCDN for CID: ${cid}`);
      
      // Download data from FilCDN
      const startTime = Date.now();
      const data = await this.storage!.providerDownload(cid);
      const endTime = Date.now();
      
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
      console.error('❌ FilCDN retrieval failed:', error);
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
    
    // If this.config.withCDN is true, use the CDN URL format
    if (this.config.withCDN) {
      // Get the provider's PDP URL if available
      if (this.providerInfo && this.providerInfo.pdpUrl) {
        return `${this.providerInfo.pdpUrl}/ipfs/${cid}`;
      }
      // Fall back to FilCDN gateway
      return `https://gateway.filcdn.io/ipfs/${cid}`;
    }
    
    // Fall back to IPFS gateway
    return `https://ipfs.io/ipfs/${cid}`;
  }

  /**
   * Get statistics about the FilCDN service
   * @returns Service statistics
   */
  async getStats(): Promise<Record<string, unknown>> {
    // Update timestamp
    this.stats.lastUpdated = Date.now();
    
    // Add balance information if available
    if (this.synapse && this.synapse.payments) {
      try {
        const balance = await this.synapse.payments.balance();
        this.stats.balance = ethers.formatUnits(balance, 18);
      } catch (e) {
        console.warn("Could not get balance information", e);
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
      // Try to download but only verify availability
      await this.storage!.providerDownload(cid, { onlyVerify: true });
      return true;
    } catch (error) {
      console.warn(`Content verification failed for CID: ${cid}`, error);
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