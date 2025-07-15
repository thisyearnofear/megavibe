// Network configuration for MegaVibe
export interface NetworkConfig {
  chainId: number;
  name: string;
  displayName: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
  supported: boolean;
}

export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: "ethereum",
    displayName: "Ethereum",
    rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: false,
    supported: true,
  },

  // Ethereum Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: "sepolia",
    displayName: "Sepolia Testnet",
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: true,
    supported: true,
  },

  // Base Mainnet
  8453: {
    chainId: 8453,
    name: "base",
    displayName: "Base",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: false,
    supported: true,
  },

  // Base Sepolia Testnet
  84532: {
    chainId: 84532,
    name: "base-sepolia",
    displayName: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: true,
    supported: true,
  },

  // Arbitrum One
  42161: {
    chainId: 42161,
    name: "arbitrum",
    displayName: "Arbitrum One",
    rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    blockExplorer: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: false,
    supported: true,
  },

  // Arbitrum Sepolia
  421614: {
    chainId: 421614,
    name: "arbitrum-sepolia",
    displayName: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: true,
    supported: true,
  },

  // Optimism
  10: {
    chainId: 10,
    name: "optimism",
    displayName: "Optimism",
    rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    blockExplorer: "https://optimistic.etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: false,
    supported: true,
  },

  // Optimism Sepolia
  11155420: {
    chainId: 11155420,
    name: "optimism-sepolia",
    displayName: "Optimism Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    blockExplorer: "https://sepolia-optimism.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: true,
    supported: true,
  },

  // Mantle Mainnet
  5000: {
    chainId: 5000,
    name: "mantle",
    displayName: "Mantle",
    rpcUrl: "https://rpc.mantle.xyz",
    blockExplorer: "https://explorer.mantle.xyz",
    nativeCurrency: {
      name: "Mantle",
      symbol: "MNT",
      decimals: 18,
    },
    testnet: false,
    supported: true,
  },

  // Mantle Sepolia
  5003: {
    chainId: 5003,
    name: "mantle-sepolia",
    displayName: "Mantle Sepolia",
    rpcUrl: "https://rpc.sepolia.mantle.xyz",
    blockExplorer: "https://explorer.sepolia.mantle.xyz",
    nativeCurrency: {
      name: "Mantle",
      symbol: "MNT",
      decimals: 18,
    },
    testnet: true,
    supported: true,
  },

  // Unichain Sepolia
  1301: {
    chainId: 1301,
    name: "unichain-sepolia",
    displayName: "Unichain Sepolia",
    rpcUrl: "https://sepolia.unichain.org",
    blockExplorer: "https://sepolia.uniscan.xyz",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: true,
    supported: true,
  },
};

// Default network (Sepolia for development, Base for production)
export const DEFAULT_CHAIN_ID = process.env.NODE_ENV === 'production' ? 8453 : 11155111;

// Get supported networks
export const SUPPORTED_NETWORKS = Object.values(NETWORK_CONFIGS).filter(
  network => network.supported
);

// Get testnet networks
export const TESTNET_NETWORKS = SUPPORTED_NETWORKS.filter(
  network => network.testnet
);

// Get mainnet networks
export const MAINNET_NETWORKS = SUPPORTED_NETWORKS.filter(
  network => !network.testnet
);

// Helper functions
export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return NETWORK_CONFIGS[chainId];
}

export function isNetworkSupported(chainId: number): boolean {
  return NETWORK_CONFIGS[chainId]?.supported || false;
}

export function getNetworkName(chainId: number): string {
  return NETWORK_CONFIGS[chainId]?.displayName || `Unknown Network (${chainId})`;
}

export function getBlockExplorer(chainId: number): string {
  return NETWORK_CONFIGS[chainId]?.blockExplorer || "";
}

export function getBlockExplorerUrl(chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string {
  const explorer = getBlockExplorer(chainId);
  if (!explorer) return "";
  
  return `${explorer}/${type}/${hash}`;
}

export function getRpcUrl(chainId: number): string {
  const config = NETWORK_CONFIGS[chainId];
  if (!config) return "";
  
  // Fallback to public RPC if no API key
  if (config.rpcUrl.includes('alchemy.com') && !process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    switch (chainId) {
      case 1:
        return "https://eth.llamarpc.com";
      case 11155111:
        return "https://ethereum-sepolia.blockpi.network/v1/rpc/public";
      case 8453:
        return "https://mainnet.base.org";
      case 84532:
        return "https://sepolia.base.org";
      default:
        return config.rpcUrl.replace(`/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, "");
    }
  }
  
  return config.rpcUrl;
}