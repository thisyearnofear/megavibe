/**
 * FilCDN Service
 * Handles file uploads to decentralized storage on Filecoin/IPFS
 * Using a secure server-side API to protect private keys
 */

// Configuration from environment variables
const FILECOIN_RPC_URL = process.env.NEXT_PUBLIC_FILECOIN_RPC_URL;
const FILCDN_ENABLED = process.env.NEXT_PUBLIC_FILCDN_ENABLED === 'true';
const USE_REAL_FILCDN = process.env.NEXT_PUBLIC_USE_REAL_FILCDN === 'true';
const FILCDN_MIN_REPUTATION = parseInt(process.env.NEXT_PUBLIC_FILCDN_MIN_REPUTATION || '100');
const API_BASE_URL = '/api/filcdn';

// Type definitions for FilCDN service
export interface StorageResult {
  cid: string;
  size: number;
  url: string;
}

export interface RetrievalResult {
  data: any;
  mimeType: string;
}

export interface FilCDNServiceConfig {
  rpcURL: string;
  withCDN: boolean;
}

export interface FilCDNService {
  initialize: () => Promise<void>;
  storeData: (data: any) => Promise<StorageResult>;
  retrieveData: (cid: string) => Promise<RetrievalResult>;
  getCDNUrl: (cid: string) => Promise<string>;
  getStats: () => Promise<any>;
}

/**
 * Calls the secure server-side API for FilCDN operations
 * This keeps private keys server-side only
 */
async function callSecureApi(operation: string, data?: any): Promise<any> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`FilCDN API error during ${operation}:`, error);
    throw error;
  }
}

// Factory function to create a FilCDN service instance
export function createFilCDNService(config: FilCDNServiceConfig): FilCDNService {
  return {
    initialize: async () => {
      console.log("Initializing FilCDN service with config:", config);
      // No need to pass private key to client - initialization happens server-side
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate initialization
    },
    
    storeData: async (data: any): Promise<StorageResult> => {
      console.log("Storing data in FilCDN via secure API");
      
      // Use the secure API to store data
      const result = await callSecureApi('store', data);
      return result.result;
    },
    
    retrieveData: async (cid: string): Promise<RetrievalResult> => {
      console.log("Retrieving data from FilCDN for CID:", cid);
      
      // Use the secure API to retrieve data
      const result = await callSecureApi('retrieve', { cid });
      return result.result;
    },
    
    getCDNUrl: async (cid: string): Promise<string> => {
      return `https://ipfs.io/ipfs/${cid}`;
    },
    
    getStats: async (): Promise<any> => {
      // Use the secure API to get stats
      const result = await callSecureApi('getStats');
      return result.result;
    }
  };
}

/**
 * Upload files to FilCDN (decentralized storage on Filecoin/IPFS)
 * @param files Array of files to upload
 * @returns Content Identifier (CID) for the uploaded files
 */
export async function uploadToFilCDN(files: File[]): Promise<string> {
  if (!files || files.length === 0) {
    throw new Error('No files provided for upload');
  }

  try {
    // Convert files to data for the secure API
    const fileData = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await file.arrayBuffer()
      }))
    );

    // Use the secure API to upload files
    const result = await callSecureApi('uploadFiles', { files: fileData });
    return result.cid;
  } catch (error) {
    console.error('Error uploading to FilCDN:', error);
    throw new Error('Failed to upload files to decentralized storage');
  }
}

/**
 * Get the gateway URL for a FilCDN CID
 * @param cid Content Identifier
 * @returns URL that can be used to access the content
 */
export function getFilCdnUrl(cid: string): string {
  if (!cid) {
    return '';
  }
  
  return `https://gateway.filcdn.io/ipfs/${cid}`;
}

/**
 * Check if a given string is a valid FilCDN CID
 * @param cid String to check
 * @returns Whether the string is a valid CID
 */
export function isValidCid(cid: string): boolean {
  if (!cid) return false;
  
  // Basic CID validation - checks for proper format
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) || /^bafy[a-z2-7]{55}$/.test(cid);
}