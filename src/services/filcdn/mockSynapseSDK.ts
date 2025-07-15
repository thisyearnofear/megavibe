/**
 * Mock implementation of @filoz/synapse-sdk for build purposes
 * This is a temporary solution until the actual SDK is available
 */

export const RPC_URLS = {
  calibration: {
    websocket: 'wss://api.calibration.node.glif.io/rpc/v1'
  }
};

export const TOKENS = {};
export const CONTRACT_ADDRESSES = {
  PANDORA_SERVICE: {
    calibration: '0x0000000000000000000000000000000000000000'
  } as Record<string, string>
};

export class StorageService {
  async upload(data: Uint8Array): Promise<{ commp: { toString: () => string } }> {
    // Mock implementation
    return {
      commp: {
        toString: () => 'mock-cid-' + Date.now()
      }
    };
  }

  async providerDownload(cid: string, options?: any): Promise<Uint8Array> {
    // Mock implementation
    return new TextEncoder().encode(JSON.stringify({ mock: true, cid }));
  }
}

export class PandoraService {
  constructor(provider: any, address: string) {}

  async checkAllowanceForStorage(dataSize: number, withCDN: boolean, payments: any) {
    return {
      sufficient: true,
      lockupAllowanceNeeded: BigInt(0),
      rateAllowanceNeeded: BigInt(0)
    };
  }
}

export class Synapse {
  payments: any = {
    deposit: async (amount: bigint) => {},
    approveService: async (address: string, rate: bigint, amount: bigint) => {},
    balance: async () => BigInt(0)
  };

  static async create(config: any): Promise<Synapse> {
    return new Synapse();
  }

  getNetwork(): string {
    return 'calibration';
  }

  getSigner(): any {
    return {
      provider: {}
    };
  }

  async createStorage(options: {
    callbacks?: {
      onProviderSelected?: (provider: any) => void;
      onProofSetResolved?: (info: any) => void;
      onProofSetCreationStarted?: (transaction: any, statusUrl: any) => void;
      onProofSetCreationProgress?: (progress: any) => void;
    }
  }): Promise<StorageService> {
    // Call callbacks if provided
    if (options.callbacks?.onProviderSelected) {
      options.callbacks.onProviderSelected({
        owner: 'mock-provider',
        pdpUrl: 'https://mock-provider.com'
      });
    }
    
    if (options.callbacks?.onProofSetResolved) {
      options.callbacks.onProofSetResolved({
        isExisting: true,
        proofSetId: 1
      });
    }

    return new StorageService();
  }
}