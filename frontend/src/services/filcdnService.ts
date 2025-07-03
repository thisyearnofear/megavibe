// FilCDN Service for MegaVibe - Decentralized Storage Integration
import { Synapse } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';

export interface FilCDNConfig {
  privateKey: string;
  rpcURL: string;
  withCDN: boolean;
}

export interface StorageResult {
  cid: string;
  size: number;
  timestamp: number;
}

export interface RetrievalResult {
  data: any;
  cid: string;
  retrievedAt: number;
}

export class FilCDNService {
  private synapse: Synapse | null = null;
  private storageService: any = null;
  private isInitialized = false;
  private config: FilCDNConfig;

  constructor(config: FilCDNConfig) {
    this.config = config;
  }

  /**
   * Initialize FilCDN service with Synapse SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ FilCDN service already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing FilCDN service...');
      
      // Create Synapse instance
      this.synapse = await Synapse.create({
        withCDN: this.config.withCDN,
        privateKey: this.config.privateKey,
        rpcURL: this.config.rpcURL
      });

      console.log('✅ Synapse SDK initialized');

      // Create storage service with callbacks
      this.storageService = await this.synapse.createStorage({
        callbacks: {
          onProviderSelected: (provider) => {
            console.log(`✓ Selected storage provider: ${provider.owner}`);
            console.log(`  PDP URL: ${provider.pdpUrl}`);
          },
          onProofSetResolved: (info) => {
            if (info.isExisting) {
              console.log(`✓ Using existing proof set: ${info.proofSetId}`);
            } else {
              console.log(`✓ Created new proof set: ${info.proofSetId}`);
            }
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

      this.isInitialized = true;
      console.log('✅ FilCDN service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize FilCDN service:', error);
      throw new Error(`FilCDN initialization failed: ${error.message}`);
    }
  }

  /**
   * Store data on FilCDN
   */
  async storeData(data: any): Promise<StorageResult> {
    await this.ensureInitialized();

    try {
      console.log('📤 Storing data on FilCDN...');
      
      // Convert data to JSON buffer
      const jsonData = JSON.stringify(data, null, 0); // Compact JSON
      const buffer = Buffer.from(jsonData, 'utf-8');
      
      console.log(`  Data size: ${buffer.length} bytes`);

      // Check file size limit (254 MiB)
      const maxSize = 254 * 1024 * 1024; // 254 MiB in bytes
      if (buffer.length > maxSize) {
        throw new Error(`Data size (${buffer.length} bytes) exceeds FilCDN limit (${maxSize} bytes)`);
      }

      // Run preflight checks
      const preflight = await this.storageService.preflightUpload(buffer.length);
      
      if (!preflight.allowanceCheck.sufficient) {
        throw new Error('Insufficient allowance. Please increase USDFC allowance via demo web app.');
      }

      // Upload to FilCDN
      const uploadResult = await this.storageService.upload(buffer);
      
      const result: StorageResult = {
        cid: uploadResult.commp,
        size: buffer.length,
        timestamp: Date.now()
      };

      console.log(`✅ Data stored successfully with CID: ${result.cid}`);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to store data:', error);
      throw new Error(`Storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve data from FilCDN
   */
  async retrieveData(cid: string): Promise<RetrievalResult> {
    await this.ensureInitialized();

    try {
      console.log(`📥 Retrieving data from FilCDN: ${cid}`);
      
      // Download from FilCDN with verification
      const downloadedData = await this.synapse!.download(cid);
      
      // Convert buffer back to JSON
      const jsonString = Buffer.from(downloadedData).toString('utf-8');
      const data = JSON.parse(jsonString);
      
      const result: RetrievalResult = {
        data,
        cid,
        retrievedAt: Date.now()
      };

      console.log(`✅ Data retrieved successfully from CID: ${cid}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to retrieve data from CID ${cid}:`, error);
      throw new Error(`Retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get direct CDN URL for a CID
   */
  async getCDNUrl(cid: string): Promise<string> {
    await this.ensureInitialized();
    
    const clientAddress = await this.synapse!.getSigner().getAddress();
    return `https://${clientAddress}.calibration.filcdn.io/${cid}`;
  }

  /**
   * Check if service is ready for operations
   */
  isReady(): boolean {
    return this.isInitialized && this.synapse !== null && this.storageService !== null;
  }

  /**
   * Get storage service statistics
   */
  async getStats(): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const clientAddress = await this.synapse!.getSigner().getAddress();
      return {
        clientAddress,
        isReady: this.isReady(),
        rpcURL: this.config.rpcURL,
        withCDN: this.config.withCDN
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Ensure service is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.isReady()) {
      throw new Error('FilCDN service is not ready. Please check initialization.');
    }
  }
}

// Export singleton instance factory
export const createFilCDNService = (config: FilCDNConfig): FilCDNService => {
  return new FilCDNService(config);
};