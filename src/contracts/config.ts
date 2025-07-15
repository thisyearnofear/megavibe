/**
 * Network configuration for blockchain interactions
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Network configurations
export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  // Mantle Sepolia
  5003: {
    chainId: 5003,
    name: 'Mantle Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
    blockExplorerUrl: 'https://explorer.sepolia.mantle.xyz',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
  },
  // Base Sepolia
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  // Optimism Sepolia
  11155420: {
    chainId: 11155420,
    name: 'Optimism Sepolia',
    rpcUrl: 'https://sepolia.optimism.io',
    blockExplorerUrl: 'https://sepolia-optimism.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  // Arbitrum Sepolia
  421614: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorerUrl: 'https://sepolia.arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  // Unichain Sepolia
  1301: {
    chainId: 1301,
    name: 'Unichain Sepolia',
    rpcUrl: 'https://sepolia.unichain.org',
    blockExplorerUrl: 'https://sepolia.uniscan.xyz',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Default network (Mantle Sepolia)
export const DEFAULT_NETWORK = NETWORK_CONFIGS[5003];

// Blockchain configuration
export const BLOCKCHAIN_CONFIG = {
  defaultChainId: 5003, // Mantle Sepolia
  supportedChains: [5003, 84532, 11155420, 421614, 1301], // All configured networks
};

/**
 * Get network configuration by chain ID
 * @param chainId Chain ID
 * @returns Network configuration or null if not found
 */
export function getNetworkConfig(chainId: number): NetworkConfig | null {
  return NETWORK_CONFIGS[chainId] || null;
}

/**
 * Check if a chain ID is supported
 * @param chainId Chain ID
 * @returns True if supported
 */
export function isNetworkSupported(chainId: number): boolean {
  return chainId in NETWORK_CONFIGS;
}

/**
 * Get all supported networks
 * @returns Array of supported network configurations
 */
export function getSupportedNetworks(): NetworkConfig[] {
  return Object.values(NETWORK_CONFIGS);
}

/**
 * Get network name by chain ID
 * @param chainId Chain ID
 * @returns Network name or 'Unknown Network'
 */
export function getNetworkName(chainId: number): string {
  const config = getNetworkConfig(chainId);
  return config?.name || 'Unknown Network';
}

/**
 * Get block explorer URL for a transaction
 * @param chainId Chain ID
 * @param txHash Transaction hash
 * @returns Block explorer URL
 */
export function getTransactionUrl(chainId: number, txHash: string): string {
  const config = getNetworkConfig(chainId);
  if (!config) {
    return '#';
  }
  return `${config.blockExplorerUrl}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 * @param chainId Chain ID
 * @param address Address
 * @returns Block explorer URL
 */
export function getAddressUrl(chainId: number, address: string): string {
  const config = getNetworkConfig(chainId);
  if (!config) {
    return '#';
  }
  return `${config.blockExplorerUrl}/address/${address}`;
}