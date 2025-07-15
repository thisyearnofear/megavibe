/**
 * Contract addresses for different networks
 */

export interface ContractAddresses {
  MegaVibeBounties: string;
  MegaVibeTipping: string;
  SimpleReputation: string;
}

// Network configurations
export const NETWORK_ADDRESSES: Record<number, Partial<ContractAddresses>> = {
  // Mantle Sepolia
  5003: {
    MegaVibeBounties: process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    MegaVibeTipping: process.env.NEXT_PUBLIC_TIPPING_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    SimpleReputation: process.env.NEXT_PUBLIC_SIMPLE_REPUTATION_MANTLE_SEPOLIA || '0x0000000000000000000000000000000000000000',
  },
  // Base Sepolia
  84532: {
    SimpleReputation: process.env.NEXT_PUBLIC_SIMPLE_REPUTATION_BASE_SEPOLIA || '0x0000000000000000000000000000000000000000',
  },
  // Optimism Sepolia
  11155420: {
    SimpleReputation: process.env.NEXT_PUBLIC_SIMPLE_REPUTATION_OP_SEPOLIA || '0x0000000000000000000000000000000000000000',
  },
  // Arbitrum Sepolia
  421614: {
    SimpleReputation: process.env.NEXT_PUBLIC_SIMPLE_REPUTATION_ARB_SEPOLIA || '0x0000000000000000000000000000000000000000',
  },
  // Unichain Sepolia
  1301: {
    SimpleReputation: process.env.NEXT_PUBLIC_SIMPLE_REPUTATION_UNICHAIN_SEPOLIA || '0x0000000000000000000000000000000000000000',
  },
};

// Default chain ID (Mantle Sepolia)
export const DEFAULT_CHAIN_ID = 5003;

/**
 * Get contract address for a specific contract and chain
 * @param contractName Name of the contract
 * @param chainId Chain ID
 * @returns Contract address or null if not found
 */
export function getContractAddress(
  contractName: keyof ContractAddresses,
  chainId: number = DEFAULT_CHAIN_ID
): string | null {
  const networkAddresses = NETWORK_ADDRESSES[chainId];
  if (!networkAddresses) {
    console.warn(`No addresses configured for chain ID ${chainId}`);
    return null;
  }

  const address = networkAddresses[contractName];
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    console.warn(`No address configured for ${contractName} on chain ${chainId}`);
    return null;
  }

  return address;
}

/**
 * Check if a contract is deployed on a specific chain
 * @param contractName Name of the contract
 * @param chainId Chain ID
 * @returns True if contract is deployed
 */
export function isContractDeployed(
  contractName: keyof ContractAddresses,
  chainId: number = DEFAULT_CHAIN_ID
): boolean {
  const address = getContractAddress(contractName, chainId);
  return address !== null && address !== '0x0000000000000000000000000000000000000000';
}

/**
 * Get all available contracts for a chain
 * @param chainId Chain ID
 * @returns Object with available contract addresses
 */
export function getChainContracts(chainId: number = DEFAULT_CHAIN_ID): Partial<ContractAddresses> {
  return NETWORK_ADDRESSES[chainId] || {};
}