'use client';

import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, sepolia, optimism, optimismSepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';

if (!projectId) {
  console.warn('NEXT_PUBLIC_WC_PROJECT_ID is not set');
} else {
  console.log('WalletConnect Project ID configured:', projectId.substring(0, 8) + '...');
}

// Define Mantle Sepolia chain
const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://explorer.sepolia.mantle.xyz',
    },
  },
  testnet: true,
});

// Get the current URL for metadata
const getAppUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side rendering
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://megavibe.vercel.app';
};

// Define the chains
const chains = [mainnet, sepolia, optimism, optimismSepolia, mantleSepolia] as const;

// Create wagmi config
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata: {
    name: 'MegaVibe',
    description: 'The Stage for Live Performance Economy',
    url: getAppUrl(),
    icons: [`${getAppUrl()}/favicon.ico`]
  },
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true
});

export { chains, mantleSepolia };