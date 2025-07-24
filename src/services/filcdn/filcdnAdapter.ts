/**
 * FilCDN Service Adapter
 *
 * This adapter provides a unified interface to the FilCDN service,
 * automatically selecting between server-based and client-based implementations
 * based on environment configuration.
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
 * @returns A FilCDN service instance
 */
export function createFilCDNAdapter(config: FilCDNAdapterConfig): FilCDNService {
  console.log(`Creating FilCDN adapter with useReal=${config.useReal}`);

  if (config.useReal) {
    // Create server-based FilCDN service that interacts with secure API endpoints
    console.log('Using server-based FilCDN service (production implementation)');
    const serverService = createServerFilCDNService({
      baseUrl: '/api/filcdn',
      withCDN: config.withCDN
    });

    // Wrap the server service with the standard FilCDNService interface
    return {
      initialize: async () => {
        await serverService.initialize();
      },
      
      storeData: async (data: unknown): Promise<StorageResult> => {
        return await serverService.storeData(data);
      },
      
      retrieveData: async (cid: string): Promise<RetrievalResult> => {
        return await serverService.retrieveData(cid);
      },
      
      getCDNUrl: async (cid: string): Promise<string> => {
        return await serverService.getCDNUrl(cid);
      },
      
      getStats: async (): Promise<unknown> => {
        return await serverService.getStats();
      }
    };
  } else {
    // Use development service for testing
    console.log('Using development FilCDN service');
    return createFilCDNService({
      rpcURL: config.rpcURL,
      withCDN: config.withCDN
    });
  }
}