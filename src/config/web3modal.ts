'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';

import { config } from './wagmi';

const queryClient = new QueryClient();

// Get projectId from environment - support both variable names for compatibility
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Create modal only if projectId is available
let modalCreated = false;
if (projectId && typeof window !== 'undefined') {
  try {
    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      enableAnalytics: false, // Disable analytics to avoid 401 errors
      enableOnramp: true,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#6366f1',
        '--w3m-border-radius-master': '8px'
      },
      // Add metadata to prevent origin mismatch issues
      metadata: {
        name: 'MegaVibe',
        description: 'The Stage for Live Performance Economy',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://megavibe.vercel.app',
        icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://megavibe.vercel.app'}/favicon.ico`]
      },
      // Disable features that might cause conflicts
      featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
      ]
    });
    modalCreated = true;
    console.log('✅ Web3Modal created successfully with projectId:', projectId.substring(0, 8) + '...');
  } catch (error) {
    console.warn('❌ Failed to create Web3Modal:', error);
  }
} else {
  console.warn('⚠️ Web3Modal not created - missing projectId or not in browser environment');
}

export function Web3ModalProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(
    WagmiProvider,
    { config },
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  );
}