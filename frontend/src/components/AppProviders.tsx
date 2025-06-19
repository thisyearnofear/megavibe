import React, { ReactNode } from 'react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { createConfig, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { WalletProvider } from '../contexts/WalletContext';
import { EventProvider } from '../contexts/EventContext';

// Simple Mantle Sepolia configuration
const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
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
} as const;

// Wagmi configuration
const config = createConfig({
  chains: [mantleSepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mantleSepolia.id]: http(),
  },
});

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || 'cd08ffe6-e5d5-49d4-8cb3-f9419a7f5e4d',
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: [
            {
              blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz'],
              chainId: 5003,
              chainName: 'Mantle Sepolia',
              iconUrls: ['https://icons.llamao.fi/icons/chains/rsz_mantle.jpg'],
              name: 'Mantle Sepolia',
              nativeCurrency: {
                decimals: 18,
                name: 'MNT',
                symbol: 'MNT',
              },
              networkId: 5003,
              rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
              vanityName: 'Mantle Sepolia',
            },
          ],
        },
        initialAuthenticationMode: 'connect-only',
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <WalletProvider>
              <EventProvider>
                {children}
              </EventProvider>
            </WalletProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
};
