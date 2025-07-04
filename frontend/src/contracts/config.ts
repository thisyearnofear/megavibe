/**
 * Blockchain network configuration for MegaVibe
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Primary network configuration - Mantle Sepolia
export const MANTLE_SEPOLIA_CONFIG: NetworkConfig = {
  chainId: Number(process.env.NEXT_PUBLIC_MANTLE_CHAIN_ID || '5003'),
  name: process.env.NEXT_PUBLIC_MANTLE_NETWORK_NAME || 'Mantle Sepolia',
  rpcUrl: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  blockExplorer: 'https://explorer.sepolia.mantle.xyz',
  nativeCurrency: {
    name: 'Mantle Network Token',
    symbol: 'MNT',
    decimals: 18,
  },
};

// Future support for other networks
export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  MANTLE_SEPOLIA_CONFIG,
  // Additional networks can be added here in the future
];

// Default network to use
export const DEFAULT_NETWORK = MANTLE_SEPOLIA_CONFIG;

// Check if a chain ID is supported
export function isNetworkSupported(chainId: number): boolean {
  return SUPPORTED_NETWORKS.some(network => network.chainId === chainId);
}

// Get network config by chain ID
export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return SUPPORTED_NETWORKS.find(network => network.chainId === chainId);
}