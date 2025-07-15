// Blockchain configuration for MegaVibe
import { DEFAULT_CHAIN_ID, SUPPORTED_CHAINS } from './addresses';

export const BLOCKCHAIN_CONFIG = {
  defaultChainId: DEFAULT_CHAIN_ID,
  supportedChains: SUPPORTED_CHAINS,
  
  // RPC URLs with fallbacks
  rpcUrls: {
    // Ethereum Mainnet & Testnet
    1: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY 
      ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : 'https://eth.llamarpc.com',
    11155111: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    
    // Base
    8453: 'https://mainnet.base.org',
    84532: 'https://sepolia.base.org',
    
    // Arbitrum
    42161: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      ? `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : 'https://arbitrum.llamarpc.com',
    421614: 'https://sepolia-rollup.arbitrum.io/rpc',
    
    // Optimism
    10: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      ? `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : 'https://optimism.llamarpc.com',
    11155420: 'https://sepolia.optimism.io',
  },
  
  // Block explorers
  blockExplorers: {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    8453: 'https://basescan.org',
    84532: 'https://sepolia.basescan.org',
    42161: 'https://arbiscan.io',
    421614: 'https://sepolia.arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    11155420: 'https://sepolia-optimism.etherscan.io',
  },
  
  // Network names
  networkNames: {
    1: 'Ethereum',
    11155111: 'Sepolia',
    8453: 'Base',
    84532: 'Base Sepolia',
    42161: 'Arbitrum',
    421614: 'Arbitrum Sepolia',
    10: 'Optimism',
    11155420: 'Optimism Sepolia',
  },
  
  // Native currencies
  nativeCurrencies: {
    1: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    11155111: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    8453: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    84532: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    42161: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    421614: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    10: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    11155420: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  },
};

// Helper functions
export function getNetworkName(chainId: number): string {
  return BLOCKCHAIN_CONFIG.networkNames[chainId as keyof typeof BLOCKCHAIN_CONFIG.networkNames] || `Network ${chainId}`;
}

export function getBlockExplorerUrl(chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string {
  const explorer = BLOCKCHAIN_CONFIG.blockExplorers[chainId as keyof typeof BLOCKCHAIN_CONFIG.blockExplorers];
  return explorer ? `${explorer}/${type}/${hash}` : '';
}

export function getRpcUrl(chainId: number): string {
  return BLOCKCHAIN_CONFIG.rpcUrls[chainId as keyof typeof BLOCKCHAIN_CONFIG.rpcUrls] || '';
}

export function isNetworkSupported(chainId: number): boolean {
  return BLOCKCHAIN_CONFIG.supportedChains.includes(chainId);
}

export function getNetworkConfig(chainId: number) {
  return {
    rpcUrl: getRpcUrl(chainId),
    blockExplorerUrl: BLOCKCHAIN_CONFIG.blockExplorers[chainId as keyof typeof BLOCKCHAIN_CONFIG.blockExplorers],
    networkName: getNetworkName(chainId),
    nativeCurrency: BLOCKCHAIN_CONFIG.nativeCurrencies[chainId as keyof typeof BLOCKCHAIN_CONFIG.nativeCurrencies],
  };
}