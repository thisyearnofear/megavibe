// Wagmi configuration for MegaVibe
import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum, optimism, base } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';
import { env } from './environment';

// Define supported chains
export const supportedChains = [
  mainnet,
  arbitrum, 
  optimism,
  base,
  // Add Mantle Sepolia testnet
  {
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
  },
] as const;

// Create wagmi configuration
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: env.development.isDevelopment ? 'demo-project-id' : 'your-walletconnect-project-id',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [5003]: http('https://rpc.sepolia.mantle.xyz'), // Mantle Sepolia
  },
});

export default wagmiConfig;
