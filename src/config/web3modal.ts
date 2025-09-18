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
      enableOnramp: true
    });
    modalCreated = true;
  } catch (error) {
    console.warn('Failed to create Web3Modal:', error);
  }
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