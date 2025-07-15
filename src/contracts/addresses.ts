// Contract addresses for different networks
// This file will be auto-updated by deployment scripts

export const CONTRACTS = {
  MegaVibeTipping: process.env.NEXT_PUBLIC_CONTRACT_TIPPING_ADDRESS || "",
  MegaVibeBounties: process.env.NEXT_PUBLIC_CONTRACT_BOUNTIES_ADDRESS || "",
  SimpleReputation: process.env.NEXT_PUBLIC_CONTRACT_REPUTATION_ADDRESS || "",
} as const;

// Multi-network contract addresses
export const CONTRACT_ADDRESSES: Record<number, Partial<typeof CONTRACTS>> = {
  // Sepolia Testnet (Development)
  11155111: {
    MegaVibeTipping: process.env.NEXT_PUBLIC_CONTRACT_TIPPING_ADDRESS,
    MegaVibeBounties: process.env.NEXT_PUBLIC_CONTRACT_BOUNTIES_ADDRESS,
    SimpleReputation: process.env.NEXT_PUBLIC_CONTRACT_REPUTATION_ADDRESS,
  },
  
  // Base Mainnet (Production)
  8453: {
    MegaVibeTipping: process.env.NEXT_PUBLIC_BASE_CONTRACT_TIPPING_ADDRESS,
    MegaVibeBounties: process.env.NEXT_PUBLIC_BASE_CONTRACT_BOUNTIES_ADDRESS,
    SimpleReputation: process.env.NEXT_PUBLIC_BASE_CONTRACT_REPUTATION_ADDRESS,
  },
  
  // Arbitrum One (Alternative)
  42161: {
    MegaVibeTipping: process.env.NEXT_PUBLIC_ARB_CONTRACT_TIPPING_ADDRESS,
    MegaVibeBounties: process.env.NEXT_PUBLIC_ARB_CONTRACT_BOUNTIES_ADDRESS,
    SimpleReputation: process.env.NEXT_PUBLIC_ARB_CONTRACT_REPUTATION_ADDRESS,
  },
};

// Default network configuration
export const DEFAULT_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 
  (process.env.NODE_ENV === 'production' ? "8453" : "11155111")
);

export const SUPPORTED_CHAINS = [
  11155111, // Sepolia
  8453,     // Base
  42161,    // Arbitrum
  10,       // Optimism
  84532,    // Base Sepolia
  421614,   // Arbitrum Sepolia
  11155420, // Optimism Sepolia
];

// Helper function to get contract address for current network
export function getContractAddress(
  contractName: keyof typeof CONTRACTS, 
  chainId?: number
): string {
  const targetChainId = chainId || DEFAULT_CHAIN_ID;
  const networkAddresses = CONTRACT_ADDRESSES[targetChainId];
  
  if (networkAddresses && networkAddresses[contractName]) {
    return networkAddresses[contractName]!;
  }
  
  // Fallback to default
  return CONTRACTS[contractName];
}