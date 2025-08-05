'use client';

import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, sepolia, optimism, optimismSepolia } from 'wagmi/chains';

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';

if (!projectId) {
  console.warn('NEXT_PUBLIC_WC_PROJECT_ID is not set');
}

// Define the chains
const chains = [mainnet, sepolia, optimism, optimismSepolia] as const;

// Create wagmi config
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata: {
    name: 'MegaVibe',
    description: 'The Stage for Live Performance Economy',
    url: 'https://megavibe.app',
    icons: ['https://megavibe.app/favicon.ico']
  },
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true
});

export { chains };