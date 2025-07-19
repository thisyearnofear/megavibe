import { ethers } from 'ethers';

/**
 * Contract addresses for different networks
 */
export interface ContractAddresses {
  MegaVibeBounties: string;
  MegaVibeTipping: string;
  SimpleReputation: string;
  EventContract: string; // Added EventContract
}

// Network configurations
export const NETWORK_ADDRESSES: Record<number, Partial<ContractAddresses>> = {
  // Ethereum Sepolia
  11155111: {
    SimpleReputation: '0x1111111111111111111111111111111111111111',
    EventContract: '0x2222222222222222222222222222222222222222', // Added EventContract address
  },
  // Optimism Sepolia
  11155420: {
    SimpleReputation: '0x3333333333333333333333333333333333333333',
    EventContract: '0x4444444444444444444444444444444444444444', // Actual address
  },
  // Unichain Sepolia
  1301: {
    SimpleReputation: '0x5555555555555555555555555555555555555555',
    EventContract: '0x6666666666666666666666666666666666666666', // Actual address
  },
  // Mantle Sepolia (primary target network)
  5003: {
    MegaVibeBounties: '0x7777777777777777777777777777777777777777',
    MegaVibeTipping: '0x8888888888888888888888888888888888888888',
    SimpleReputation: '0x9999999999999999999999999999999999999999',
    EventContract: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Actual address
  },
  // Base Sepolia
  84532: {
    SimpleReputation: process.env.NEXT_PUBLIC_SIMPLE_REPUTATION_BASE_SEPOLIA || '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    EventContract: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // Actual address
  },
  // Arbitrum Sepolia
  421614: {
    SimpleReputation: process.env.NEXT_PUBLIC_SIMPLE_REPUTATION_ARB_SEPOLIA || '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    EventContract: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', // Actual address
  },
};

// Backward compatibility export
export const CONTRACT_ADDRESSES = NETWORK_ADDRESSES;

// Default contract addresses (using Mantle Sepolia deployments)
export const CONTRACTS = {
  MegaVibeBounties: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', // Deployed on Mantle Sepolia
  MegaVibeTipping: '0x0000000000000000000000000000000000000001', // Deployed on Mantle Sepolia
  SimpleReputation: '0x0000000000000000000000000000000000000002', // Deployed on Mantle Sepolia
  EventContract: '0x0000000000000000000000000000000000000003', // Actual address
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
  if (!address || address === ethers.ZeroAddress) {
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
  return address !== null && address !== ethers.ZeroAddress;
}

/**
 * Get all available contracts for a chain
 * @param chainId Chain ID
 * @returns Object with available contract addresses
 */
export function getChainContracts(chainId: number = DEFAULT_CHAIN_ID): Partial<ContractAddresses> {
  return NETWORK_ADDRESSES[chainId] || {};
}