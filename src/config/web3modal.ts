'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';

import { config } from './wagmi';

const queryClient = new QueryClient();

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';

// Create modal only if projectId is available
let modalCreated = false;
if (projectId && typeof window !== 'undefined') {
  try {
    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      enableAnalytics: true,
      enableOnramp: true,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#6366f1',
        '--w3m-border-radius-master': '8px'
      }
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