// Wagmi configuration for MegaVibe
import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum, optimism, base, sepolia, arbitrumSepolia, optimismSepolia, baseSepolia, linea, lineaSepolia } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';
import { env } from './environment';

// Define supported chains for hackathon
export const supportedChains = [
  // Mainnets
  mainnet,
  arbitrum, 
  optimism,
  base,
  linea,
  
  // Testnets for hackathon
  sepolia,
  arbitrumSepolia,
  optimismSepolia,
  baseSepolia,
  lineaSepolia,
  
  // Mantle Sepolia testnet
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
    // Mainnets
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [linea.id]: http(),
    
    // Testnets
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [baseSepolia.id]: http(),
    [lineaSepolia.id]: http(),
    [5003]: http('https://rpc.sepolia.mantle.xyz'), // Mantle Sepolia
  },
});

export default wagmiConfig;
