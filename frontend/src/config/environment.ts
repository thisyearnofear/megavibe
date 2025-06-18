// Environment configuration utility for MegaVibe
// Centralizes environment variable access and provides debugging

export interface EnvironmentConfig {
  // API Configuration
  apiUrl: string;
  wsUrl: string;
  environment: string;

  // Dynamic.xyz Configuration
  dynamicEnvironmentId: string;

  // Mantle Network Configuration
  mantleRpcUrl: string;
  mantleChainId: number;
  mantleNetworkName: string;

  // Smart Contract Configuration
  tippingContractAddress: string;
  tippingContractNetwork: string;

  // Fee Configuration
  feeRecipientAddress: string;
  platformFeePercentage: number;

  // Development Features
  debugMode: boolean;
  logLevel: string;
}

class Environment {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfiguration();

    if (this.config.debugMode) {
      this.logConfiguration();
    }
  }

  private loadConfiguration(): EnvironmentConfig {
    return {
      // API Configuration
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:3000',
      environment: import.meta.env.VITE_ENVIRONMENT || 'development',

      // Dynamic.xyz Configuration
      dynamicEnvironmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || 'cd08ffe6-e5d5-49d4-8cb3-f9419a7f5e4d',

      // Mantle Network Configuration
      mantleRpcUrl: import.meta.env.VITE_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
      mantleChainId: Number(import.meta.env.VITE_MANTLE_CHAIN_ID) || 5003,
      mantleNetworkName: import.meta.env.VITE_MANTLE_NETWORK_NAME || 'Mantle Sepolia',

      // Smart Contract Configuration
      tippingContractAddress: import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS || '0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F',
      tippingContractNetwork: import.meta.env.VITE_TIPPING_CONTRACT_NETWORK || 'mantleSepolia',

      // Fee Configuration
      feeRecipientAddress: import.meta.env.VITE_FEE_RECIPIENT_ADDRESS || '0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901',
      platformFeePercentage: Number(import.meta.env.VITE_PLATFORM_FEE_PERCENTAGE) || 5,

      // Development Features
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    };
  }

  private logConfiguration(): void {
    console.group('🔧 MegaVibe Environment Configuration');
    console.log('Environment:', this.config.environment);
    console.log('API URL:', this.config.apiUrl);
    console.log('WebSocket URL:', this.config.wsUrl);
    console.log('Dynamic Environment ID:', this.config.dynamicEnvironmentId);
    console.log('Mantle Chain ID:', this.config.mantleChainId);
    console.log('Mantle RPC URL:', this.config.mantleRpcUrl);
    console.log('Network Name:', this.config.mantleNetworkName);
    console.log('Contract Address:', this.config.tippingContractAddress);
    console.log('Fee Recipient:', this.config.feeRecipientAddress);
    console.log('Platform Fee:', `${this.config.platformFeePercentage}%`);
    console.log('Debug Mode:', this.config.debugMode);
    console.groupEnd();
  }

  // Getters for easy access
  get api() {
    return {
      url: this.config.apiUrl,
      wsUrl: this.config.wsUrl,
    };
  }

  get dynamic() {
    return {
      environmentId: this.config.dynamicEnvironmentId,
    };
  }

  get mantle() {
    return {
      chainId: this.config.mantleChainId,
      name: this.config.mantleNetworkName,
      rpcUrl: this.config.mantleRpcUrl,
      blockExplorerUrl: 'https://explorer.sepolia.mantle.xyz',
    };
  }

  get contracts() {
    return {
      tipping: {
        address: this.config.tippingContractAddress,
        network: this.config.tippingContractNetwork,
      },
    };
  }

  get fees() {
    return {
      recipient: this.config.feeRecipientAddress,
      percentage: this.config.platformFeePercentage,
    };
  }

  get development() {
    return {
      debug: this.config.debugMode,
      logLevel: this.config.logLevel,
      isDevelopment: this.config.environment === 'development',
      isProduction: this.config.environment === 'production',
    };
  }

  // Validation methods
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!this.config.dynamicEnvironmentId) {
      errors.push('VITE_DYNAMIC_ENVIRONMENT_ID is required');
    }

    if (!this.config.tippingContractAddress || !this.config.tippingContractAddress.startsWith('0x')) {
      errors.push('VITE_TIPPING_CONTRACT_ADDRESS must be a valid Ethereum address');
    }

    if (!this.config.feeRecipientAddress || !this.config.feeRecipientAddress.startsWith('0x')) {
      errors.push('VITE_FEE_RECIPIENT_ADDRESS must be a valid Ethereum address');
    }

    if (this.config.mantleChainId !== 5003) {
      errors.push('VITE_MANTLE_CHAIN_ID should be 5003 for Mantle Sepolia');
    }

    if (this.config.platformFeePercentage < 0 || this.config.platformFeePercentage > 100) {
      errors.push('VITE_PLATFORM_FEE_PERCENTAGE must be between 0 and 100');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Dynamic configuration for DynamicContextProvider
  getDynamicConfig() {
    return {
      environmentId: this.config.dynamicEnvironmentId,
      evmNetworks: [
        {
          blockExplorerUrls: [this.mantle.blockExplorerUrl],
          chainId: this.config.mantleChainId,
          chainName: this.config.mantleNetworkName,
          iconUrls: ['https://icons.llamao.fi/icons/chains/rsz_mantle.jpg'],
          name: this.config.mantleNetworkName,
          nativeCurrency: {
            decimals: 18,
            name: 'MNT',
            symbol: 'MNT',
            denom: 'MNT',
          },
          networkId: this.config.mantleChainId,
          rpcUrls: [this.config.mantleRpcUrl],
          vanityName: this.config.mantleNetworkName,
        },
      ],
      initialAuthenticationMode: 'connect-only' as const,
      enableVisitTrackingOnConnectOnly: true,
    };
  }

  // Wagmi configuration
  getWagmiChainConfig() {
    return {
      id: this.config.mantleChainId,
      name: this.config.mantleNetworkName,
      nativeCurrency: {
        name: 'MNT',
        symbol: 'MNT',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [this.config.mantleRpcUrl],
        },
      },
      blockExplorers: {
        default: {
          name: 'Mantle Sepolia Explorer',
          url: this.mantle.blockExplorerUrl,
        },
      },
      testnet: true,
    } as const;
  }
}

// Singleton instance
export const env = new Environment();

// Validate configuration on import
const validation = env.validateConfiguration();
if (!validation.valid) {
  console.error('❌ Environment Configuration Errors:');
  validation.errors.forEach(error => console.error(`  - ${error}`));

  if (env.development.isDevelopment) {
    console.warn('⚠️  Please check your .env files and ensure all required variables are set');
  }
}

// Export commonly used configurations
export const DYNAMIC_CONFIG = env.getDynamicConfig();
export const MANTLE_CHAIN_CONFIG = env.getWagmiChainConfig();

export default env;
