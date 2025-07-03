import { createConfig } from '@lifi/sdk';
import { env } from './environment';

/**
 * LI.FI SDK Configuration
 * 
 * This file contains configuration for the LI.FI cross-chain bridging SDK.
 * It's used by the LifiService to enable cross-chain USDC transfers.
 */

// Initialize the SDK with proper configuration
createConfig({
  // Required: Integrator name for analytics and tracking
  integrator: 'MegaVibe',
  
  // Optional: API key for higher rate limits
  apiKey: env.lifi.apiKey || undefined,
  
  // Optional: Default route options applied to all requests
  routeOptions: {
    slippage: 0.005, // 0.5%
    order: 'CHEAPEST',
    allowSwitchChain: true,
  },
  
  // Optional: Referrer information for fees
  ...(env.fees.recipient ? {
    referrer: env.fees.recipient,
    fee: env.fees.percentage / 100 // Convert from percentage to decimal
  } : {})
});

/**
 * Common USDC token addresses across different networks
 */
export const USDC_ADDRESSES: Record<number, string> = {
  // Mainnet addresses
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum Mainnet
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon Mainnet
  42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Arbitrum One
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Optimism
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  5000: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83', // Mantle
  
  // Testnet addresses (if needed)
  5: '0x07865c6e87b9f70255377e024ace6630c1eaa37f', // Goerli Testnet
  80001: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23', // Mumbai Testnet
  421613: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Goerli
  420: '0x7E07E15D2a87A24492740D16f5bdF58c16db0c4E', // Optimism Goerli
  84531: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Goerli
  
  // Custom chains (from environment)
  5003: env.contracts.usdc.address, // Mantle Sepolia
};

/**
 * Configuration options for the LI.FI service
 */
export const LIFI_CONFIG = {
  // Default slippage percentage (0.5%)
  defaultSlippage: 0.005,
  
  // Route options
  routeOptions: {
    order: 'CHEAPEST' as const,
    allowSwitchChain: true,
  },
  
  // Fee settings
  fees: {
    platformFeePercentage: env.fees.percentage / 100, // Convert from percentage to decimal
    referrer: env.fees.recipient,
  },
};

export default LIFI_CONFIG;