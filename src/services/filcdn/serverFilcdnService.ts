/**
 * Server-based FilCDN Service
 * 
 * This service communicates with server-side API endpoints to perform FilCDN operations
 * while keeping sensitive information (like private keys) secure on the server.
 */

import { StorageResult, RetrievalResult } from './filcdnService';

// Service configuration interface
export interface ServerFilCDNConfig {
  baseUrl?: string;
  withCDN?: boolean;
}

/**
 * ServerFilCDNService class
 * Provides functionality for interacting with FilCDN via server-side API
 */
export class ServerFilCDNService {
  private initialized: boolean = false;
  private initializing: boolean = false;
  private stats: Record<string, unknown> = {};
  private baseUrl: string;
  private withCDN: boolean;
  
  constructor(private config: ServerFilCDNConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/filcdn';
    this.withCDN = config.withCDN !== undefined ? config.withCDN : true;
  }

  /**
   * Initialize the FilCDN service via server API
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
      console.log("Initializing server-based FilCDN service");
      
      // Call auth endpoint to initialize FilCDN on server
      const response = await fetch(`${this.baseUrl}/auth`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Server FilCDN initialization failed');
      }
      
      const data = await response.json();
      
      if (data.status !== 'authenticated' || !data.initialized) {
        throw new Error(data.message || 'Server FilCDN not properly initialized');
      }
      
      // Update stats
      this.stats = {
        ...data.stats,
        initialized: true,
        lastUpdated: Date.now()
      };
      
      this.initialized = true;
      console.log("✅ Server-based FilCDN service initialized successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Server-based FilCDN service initialization failed:', error);
      throw new Error(`Failed to initialize server FilCDN service: ${message}`);
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Store data on FilCDN via server API
   * @param data Data to store
   * @returns Storage result
   */
  async storeData(data: unknown): Promise<StorageResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      console.log("Storing data on FilCDN via server API");
      
      // Convert data to appropriate format for transfer
      let dataToSend: string;
      
      if (data instanceof Uint8Array) {
        // Convert binary data to base64
        const bytes = Array.from(data);
        dataToSend = btoa(String.fromCharCode.apply(null, bytes));
      } else if (typeof data === 'string') {
        dataToSend = data;
      } else {
        dataToSend = JSON.stringify(data);
      }
      
      // Send to server endpoint
      const response = await fetch(`${this.baseUrl}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: dataToSend,
          format: data instanceof Uint8Array ? 'binary' : 
                  typeof data === 'string' ? 'text' : 'json'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to store data');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FilCDN storage via server failed:', error);
      throw new Error(`Failed to store data on FilCDN: ${message}`);
    }
  }

  /**
   * Retrieve data from FilCDN via server API
   * @param cid Content identifier
   * @returns Retrieval result
   */
  async retrieveData(cid: string): Promise<RetrievalResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      console.log(`Retrieving data from FilCDN for CID: ${cid}`);
      
      // Request from server endpoint
      const response = await fetch(`${this.baseUrl}/retrieve?cid=${encodeURIComponent(cid)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to retrieve data');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FilCDN retrieval via server failed:', error);
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
    
    // For CDN URLs, we can safely generate them on the client side
    // They don't expose any sensitive information
    if (this.withCDN) {
      // Get from the stats if available
      if (this.stats?.providerPdpUrl) {
        return `${this.stats.providerPdpUrl}/ipfs/${cid}`;
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
    try {
      // Call stats endpoint
      const response = await fetch(`${this.baseUrl}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      this.stats = {
        ...data,
        lastUpdated: Date.now()
      };
      
      return this.stats;
    } catch (error) {
      console.warn("Could not get FilCDN stats from server", error);
      return {
        ...this.stats,
        lastUpdated: Date.now(),
        error: 'Failed to fetch latest stats'
      };
    }
  }
}

/**
 * Create a new server-based FilCDN service instance
 * @param config Service configuration
 * @returns FilCDN service instance
 */
export function createServerFilCDNService(config: ServerFilCDNConfig = {}): ServerFilCDNService {
  return new ServerFilCDNService(config);
}