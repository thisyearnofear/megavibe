// Diagnostics utility to help debug Dynamic.xyz and wallet configuration
import { env } from '../config/environment';

export interface DiagnosticResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: unknown;
}

export class WalletDiagnostics {
  private results: DiagnosticResult[] = [];

  async runDiagnostics(): Promise<DiagnosticResult[]> {
    this.results = [];

    // Environment configuration checks
    this.checkEnvironmentVariables();
    this.checkNetworkConfiguration();
    this.checkContractConfiguration();

    // Dynamic.xyz configuration checks
    this.checkDynamicConfiguration();

    // Browser compatibility checks
    this.checkBrowserCompatibility();

    // Wallet provider checks
    await this.checkWalletProviders();

    return this.results;
  }

  private addResult(category: string, name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: unknown): void {
    this.results.push({ category, name, status, message, details });
  }

  private checkEnvironmentVariables(): void {
    const validation = env.validateConfiguration();

    if (validation.valid) {
      this.addResult('Environment', 'Configuration Validation', 'pass', 'All required environment variables are set');
    } else {
      this.addResult('Environment', 'Configuration Validation', 'fail', 'Missing or invalid environment variables', validation.errors);
    }

    // Check specific important variables
    if (env.dynamic.environmentId) {
      this.addResult('Environment', 'Dynamic Environment ID', 'pass', `Environment ID: ${env.dynamic.environmentId}`);
    } else {
      this.addResult('Environment', 'Dynamic Environment ID', 'fail', 'VITE_DYNAMIC_ENVIRONMENT_ID is not set');
    }

    if (env.contracts.tipping.address && env.contracts.tipping.address.startsWith('0x')) {
      this.addResult('Environment', 'Contract Address', 'pass', `Contract: ${env.contracts.tipping.address}`);
    } else {
      this.addResult('Environment', 'Contract Address', 'fail', 'Invalid or missing contract address');
    }
  }

  private checkNetworkConfiguration(): void {
    // Check Mantle Sepolia configuration
    if (env.mantle.chainId === 5003) {
      this.addResult('Network', 'Chain ID', 'pass', `Chain ID: ${env.mantle.chainId} (Mantle Sepolia)`);
    } else {
      this.addResult('Network', 'Chain ID', 'warning', `Unexpected chain ID: ${env.mantle.chainId}. Expected 5003 for Mantle Sepolia`);
    }

    if (env.mantle.rpcUrl.includes('sepolia.mantle.xyz')) {
      this.addResult('Network', 'RPC URL', 'pass', `RPC URL: ${env.mantle.rpcUrl}`);
    } else {
      this.addResult('Network', 'RPC URL', 'warning', `Non-standard RPC URL: ${env.mantle.rpcUrl}`);
    }

    // Test RPC connectivity
    this.testRPCConnectivity();
  }

  private async testRPCConnectivity(): Promise<void> {
    try {
      const response = await fetch(env.mantle.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const chainId = parseInt(data.result, 16);

        if (chainId === env.mantle.chainId) {
          this.addResult('Network', 'RPC Connectivity', 'pass', 'RPC endpoint is accessible and returns correct chain ID');
        } else {
          this.addResult('Network', 'RPC Connectivity', 'fail', `RPC returned chain ID ${chainId}, expected ${env.mantle.chainId}`);
        }
      } else {
        this.addResult('Network', 'RPC Connectivity', 'fail', `RPC endpoint returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.addResult('Network', 'RPC Connectivity', 'fail', `Failed to connect to RPC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private checkContractConfiguration(): void {
    // Check fee configuration
    if (env.fees.percentage >= 0 && env.fees.percentage <= 100) {
      this.addResult('Contract', 'Platform Fee', 'pass', `Platform fee: ${env.fees.percentage}%`);
    } else {
      this.addResult('Contract', 'Platform Fee', 'fail', `Invalid platform fee: ${env.fees.percentage}%. Must be between 0-100%`);
    }

    if (env.fees.recipient && env.fees.recipient.startsWith('0x')) {
      this.addResult('Contract', 'Fee Recipient', 'pass', `Fee recipient: ${env.fees.recipient}`);
    } else {
      this.addResult('Contract', 'Fee Recipient', 'fail', 'Invalid or missing fee recipient address');
    }
  }

  private checkDynamicConfiguration(): void {
    const dynamicConfig = env.getDynamicConfig();

    // Check EVM networks configuration
    if (dynamicConfig.evmNetworks && dynamicConfig.evmNetworks.length > 0) {
      const mantleNetwork = dynamicConfig.evmNetworks[0];

      if (mantleNetwork.chainId === 5003) {
        this.addResult('Dynamic', 'EVM Networks', 'pass', 'Mantle Sepolia network configured in Dynamic');
      } else {
        this.addResult('Dynamic', 'EVM Networks', 'fail', `Wrong chain ID in Dynamic config: ${mantleNetwork.chainId}`);
      }
    } else {
      this.addResult('Dynamic', 'EVM Networks', 'fail', 'No EVM networks configured in Dynamic');
    }

    // Check authentication mode
    if (dynamicConfig.initialAuthenticationMode === 'connect-only') {
      this.addResult('Dynamic', 'Auth Mode', 'pass', 'Authentication mode set to connect-only');
    } else {
      this.addResult('Dynamic', 'Auth Mode', 'warning', `Authentication mode: ${dynamicConfig.initialAuthenticationMode}`);
    }
  }

  private checkBrowserCompatibility(): void {
    // Check if running in browser
    if (typeof window === 'undefined') {
      this.addResult('Browser', 'Environment', 'fail', 'Not running in browser environment');
      return;
    }

    // Check for Web3 support
    if (typeof window.ethereum !== 'undefined') {
      this.addResult('Browser', 'Web3 Support', 'pass', 'Web3 provider detected');
    } else {
      this.addResult('Browser', 'Web3 Support', 'warning', 'No Web3 provider detected. Users will need to install a wallet extension.');
    }

    // Check for localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      this.addResult('Browser', 'LocalStorage', 'pass', 'LocalStorage is available');
    } catch {
      this.addResult('Browser', 'LocalStorage', 'fail', 'LocalStorage is not available');
    }

    // Check HTTPS (required for some wallet features)
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      this.addResult('Browser', 'HTTPS', 'pass', 'Secure context available');
    } else {
      this.addResult('Browser', 'HTTPS', 'warning', 'Not in secure context. Some wallet features may not work.');
    }
  }

  private async checkWalletProviders(): Promise<void> {
    if (typeof window === 'undefined') return;

    const providers = [];

    // Check MetaMask
    if (window.ethereum?.isMetaMask) {
      providers.push('MetaMask');
    }

    // Check Coinbase Wallet
    if (window.ethereum?.isCoinbaseWallet) {
      providers.push('Coinbase Wallet');
    }

    // Check WalletConnect
    if ((window.ethereum as any)?.isWalletConnect) {
      providers.push('WalletConnect');
    }

    // Check for any ethereum provider
    if (window.ethereum) {
      providers.push('Generic Web3 Provider');
    }

    if (providers.length > 0) {
      this.addResult('Wallets', 'Available Providers', 'pass', `Detected providers: ${providers.join(', ')}`);
    } else {
      this.addResult('Wallets', 'Available Providers', 'warning', 'No wallet providers detected');
    }

    // Check if user has any accounts
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts && accounts.length > 0) {
          this.addResult('Wallets', 'Connected Accounts', 'pass', `${accounts.length} account(s) connected`);
        } else {
          this.addResult('Wallets', 'Connected Accounts', 'warning', 'No accounts connected');
        }
      }
    } catch {
      this.addResult('Wallets', 'Connected Accounts', 'warning', 'Could not check connected accounts');
    }
  }

  // Utility method to log results to console
  logResults(): void {
    console.group('🔍 MegaVibe Wallet Diagnostics');

    const categories = [...new Set(this.results.map(r => r.category))];

    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const passCount = categoryResults.filter(r => r.status === 'pass').length;
      const failCount = categoryResults.filter(r => r.status === 'fail').length;
      const warnCount = categoryResults.filter(r => r.status === 'warning').length;

      console.group(`📂 ${category} (✅ ${passCount} ⚠️ ${warnCount} ❌ ${failCount})`);

      categoryResults.forEach(result => {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(`${icon} ${result.name}: ${result.message}`);

        if (result.details) {
          console.log('   Details:', result.details);
        }
      });

      console.groupEnd();
    });

    console.groupEnd();
  }

  // Get summary statistics
  getSummary(): { total: number; passed: number; warnings: number; failed: number } {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'pass').length,
      warnings: this.results.filter(r => r.status === 'warning').length,
      failed: this.results.filter(r => r.status === 'fail').length,
    };
  }
}

// Export convenience function
export async function runWalletDiagnostics(): Promise<DiagnosticResult[]> {
  const diagnostics = new WalletDiagnostics();
  const results = await diagnostics.runDiagnostics();

  if (env.development.debug) {
    diagnostics.logResults();
  }

  return results;
}

// Auto-run diagnostics in development
if (env.development.debug && typeof window !== 'undefined') {
  // Run diagnostics after a short delay to let everything initialize
  setTimeout(() => {
    runWalletDiagnostics();
  }, 2000);
}
