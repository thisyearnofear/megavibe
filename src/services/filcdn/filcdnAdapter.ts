/**
 * FilCDN Service Adapter
 * 
 * This adapter provides a unified interface to both the mock FilCDN service
 * and the real FilCDN service (using Synapse SDK), allowing the application
 * to switch between them based on environment configuration.
 */

import { 
  createFilCDNService, 
  FilCDNService, 
  StorageResult, 
  RetrievalResult 
} from './filcdnService';

import {
  createServerFilCDNService
} from './serverFilcdnService';

export interface FilCDNAdapterConfig {
  useReal: boolean;
  rpcURL: string;
  withCDN: boolean;
}

/**
 * Creates a FilCDN service based on configuration
 * 
 * @param config Configuration options
 * @returns A FilCDN service instance (either mock or real)
 */
export function createFilCDNAdapter(config: FilCDNAdapterConfig): FilCDNService {
  console.log(`Creating FilCDN adapter with useReal=${config.useReal}`);

  if (config.useReal) {
    // Create server-based FilCDN service that interacts with secure API endpoints
    console.log('Using server-based FilCDN service (secure implementation)');
    const serverService = createServerFilCDNService({
      baseUrl: '/api/filcdn',
      withCDN: config.withCDN
    });

    // Wrap the server service with the standard FilCDNService interface
    return {
      initialize: async () => {
        await serverService.initialize();
      },
      
      storeData: async (data: any): Promise<StorageResult> => {
        return await serverService.storeData(data);
      },
      
      retrieveData: async (cid: string): Promise<RetrievalResult> => {
        return await serverService.retrieveData(cid);
      },
      
      getCDNUrl: async (cid: string): Promise<string> => {
        return await serverService.getCDNUrl(cid);
      },
      
      getStats: async (): Promise<any> => {
        return await serverService.getStats();
      }
    };
  } else {
    // Use mock service
    console.log('Using mock FilCDN service');
    return createFilCDNService({
      rpcURL: config.rpcURL,
      withCDN: config.withCDN
    });
  }
}