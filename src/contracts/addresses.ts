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
  // Ethereum Sepolia
  11155111: {
    SimpleReputation: '0x4B7F67dBe2731E462A4047a19B2fdF14C910afEa',
  },
  // Optimism Sepolia
  11155420: {
    SimpleReputation: '0x7877Ac5C8158AB46ad608CB6990eCcB2A5265718',
  },
  // Unichain Sepolia
  1301: {
    SimpleReputation: '0x53628a5d15cfFac8C8F6c95b76b4FA436C7eaD1A',
  },
  // Mantle Sepolia (primary target network)
  5003: {
    MegaVibeBounties: '0xA78d4FcDaee13A11c11AEaD7f3a68CD15E8CB722',
    MegaVibeTipping: '0x86D7cD141775f866403161974fB941F39F4C38Ef',
    SimpleReputation: '0x53628a5d15cfFac8C8F6c95b76b4FA436C7eaD1A',
  },
  // Base Sepolia
  84532: {
    SimpleReputation: process.env.NEXT_PUBLIC_SIMPLE_REPUTATION_BASE_SEPOLIA || '0x0000000000000000000000000000000000000000',
  },
  // Arbitrum Sepolia
  421614: {
    SimpleReputation: process.env.NEXT_PUBLIC_SIMPLE_REPUTATION_ARB_SEPOLIA || '0x0000000000000000000000000000000000000000',
  },
};

// Backward compatibility export
export const CONTRACT_ADDRESSES = NETWORK_ADDRESSES;

// Default contract addresses (using Mantle Sepolia deployments)
export const CONTRACTS = {
  MegaVibeBounties: '0xA78d4FcDaee13A11c11AEaD7f3a68CD15E8CB722', // Deployed on Mantle Sepolia
  MegaVibeTipping: '0x86D7cD141775f866403161974fB941F39F4C38Ef', // Deployed on Mantle Sepolia
  SimpleReputation: '0x53628a5d15cfFac8C8F6c95b76b4FA436C7eaD1A', // Deployed on Mantle Sepolia
};

// Default chain ID (Mantle Sepolia for main contracts, Ethereum Sepolia for SimpleReputation)
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