/**
 * Deployed contract addresses for MegaVibe
 */
import { NetworkConfig } from './config';

export interface ContractAddresses {
  MegaVibeBounties: string;
  MegaVibeTipping: string;
  EventContract: string;
}

// Contract addresses by network ID
// These will need to be updated with the actual deployed addresses
const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  // Mantle Sepolia (Chain ID: 5003)
  5003: {
    MegaVibeBounties: '0xf6D9428094bD1EF3427c8f0bBce6A4068B900b5F',
    MegaVibeTipping: '0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F',
    EventContract: '0x0000000000000000000000000000000000000000', // Not deployed yet or not needed
  },
  // Add more networks as they're supported
};

/**
 * Get contract addresses for a specific network
 * @param chainId The blockchain network ID
 * @returns Contract addresses for the specified network, or undefined if not supported
 */
export function getContractAddresses(chainId: number): ContractAddresses | undefined {
  return CONTRACT_ADDRESSES[chainId];
}

/**
 * Get a specific contract address
 * @param chainId The blockchain network ID
 * @param contractName The name of the contract
 * @returns The contract address or undefined if not found
 */
export function getContractAddress(
  chainId: number,
  contractName: keyof ContractAddresses
): string | undefined {
  const addresses = getContractAddresses(chainId);
  return addresses ? addresses[contractName] : undefined;
}

/**
 * Check if a network has all required contract addresses configured
 * @param chainId The blockchain network ID
 * @returns True if all required contracts are configured
 */
export function isNetworkConfigured(chainId: number): boolean {
  const addresses = getContractAddresses(chainId);
  if (!addresses) return false;
  
  // Check that all addresses are defined and not the zero address
  return (
    !!addresses.MegaVibeBounties &&
    addresses.MegaVibeBounties !== '0x0000000000000000000000000000000000000000' &&
    !!addresses.MegaVibeTipping &&
    addresses.MegaVibeTipping !== '0x0000000000000000000000000000000000000000' &&
    !!addresses.EventContract &&
    addresses.EventContract !== '0x0000000000000000000000000000000000000000'
  );
}