import React, { ReactNode } from 'react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { createConfig, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { MetaMaskProvider } from '@metamask/sdk-react';
import { AuthProvider } from '../contexts/AuthContext';
import { WalletProvider } from '../contexts/WalletContext';
import { EventProvider } from '../contexts/EventContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { supportedChains } from '../config/wagmi';

// Wagmi configuration using the comprehensive chain setup
const config = createConfig({
  chains: supportedChains,
  multiInjectedProviderDiscovery: false,
  transports: {
    // Mainnets
    1: http(), // Ethereum
    42161: http(), // Arbitrum
    10: http(), // Optimism
    8453: http(), // Base
    59144: http(), // Linea
    
    // Testnets
    11155111: http(), // Sepolia
    421614: http(), // Arbitrum Sepolia
    11155420: http(), // OP Sepolia
    84532: http(), // Base Sepolia
    59141: http(), // Linea Sepolia
    5003: http('https://rpc.sepolia.mantle.xyz'), // Mantle Sepolia
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
    <MetaMaskProvider
      debug={import.meta.env.VITE_DEBUG_MODE === 'true'}
      sdkOptions={{
        dappMetadata: {
          name: 'MegaVibe',
          url: window.location.origin,
          iconUrl: `${window.location.origin}/images/megavibe.png`,
        },
        preferDesktop: false,
        extensionOnly: false,
        checkInstallationImmediately: false,
        storage: {
          enabled: true,
        },
        logging: {
          developerMode: import.meta.env.VITE_DEBUG_MODE === 'true',
        },
      }}
    >
      <DynamicContextProvider
        settings={{
          environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || 'cd08ffe6-e5d5-49d4-8cb3-f9419a7f5e4d',
          walletConnectors: [EthereumWalletConnectors],
          overrides: {
            evmNetworks: [
              // Mantle Sepolia
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
              // Linea Sepolia (Required for hackathon)
              {
                blockExplorerUrls: ['https://sepolia.lineascan.build'],
                chainId: 59141,
                chainName: 'Linea Sepolia',
                iconUrls: ['https://icons.llamao.fi/icons/chains/rsz_linea.jpg'],
                name: 'Linea Sepolia',
                nativeCurrency: {
                  decimals: 18,
                  name: 'ETH',
                  symbol: 'ETH',
                },
                networkId: 59141,
                rpcUrls: ['https://rpc.sepolia.linea.build'],
                vanityName: 'Linea Sepolia',
              },
              // Base Sepolia
              {
                blockExplorerUrls: ['https://sepolia.basescan.org'],
                chainId: 84532,
                chainName: 'Base Sepolia',
                iconUrls: ['https://icons.llamao.fi/icons/chains/rsz_base.jpg'],
                name: 'Base Sepolia',
                nativeCurrency: {
                  decimals: 18,
                  name: 'ETH',
                  symbol: 'ETH',
                },
                networkId: 84532,
                rpcUrls: ['https://sepolia.base.org'],
                vanityName: 'Base Sepolia',
              },
            ],
          },
          initialAuthenticationMode: 'connect-only',
        }}
      >
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <DynamicWagmiConnector>
              <AuthProvider>
                <ToastProvider>
                  <WalletProvider>
                    <ProfileProvider>
                      <EventProvider>
                        {children}
                      </EventProvider>
                    </ProfileProvider>
                  </WalletProvider>
                </ToastProvider>
              </AuthProvider>
            </DynamicWagmiConnector>
          </QueryClientProvider>
        </WagmiProvider>
      </DynamicContextProvider>
    </MetaMaskProvider>
  );
};
