/**
 * Ethereum utilities for safe window.ethereum access
 * Handles cases where window.ethereum might be read-only or have getters
 */

// Type definitions for better TypeScript support
export interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isConnected?: () => boolean;
  chainId?: string;
  selectedAddress?: string;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

/**
 * Safely check if Ethereum provider is available
 * Handles cases where window.ethereum might be read-only or have getters
 */
export function isEthereumAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  } catch (error) {
    console.warn('⚠️ Error accessing window.ethereum:', error);
    return false;
  }
}

/**
 * Safely get the Ethereum provider
 * Returns null if not available or if there's an error accessing it
 */
export function getEthereumProvider(): EthereumProvider | null {
  try {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Error getting Ethereum provider:', error);
    return null;
  }
}

/**
 * Safely add event listeners to the Ethereum provider
 * Handles cases where the provider might not support event listeners
 */
export function addEthereumEventListener(
  event: string,
  handler: (...args: any[]) => void
): boolean {
  try {
    const provider = getEthereumProvider();
    if (provider && typeof provider.on === 'function') {
      provider.on(event, handler);
      return true;
    }
    console.warn(`⚠️ Cannot add event listener for ${event}: provider does not support events`);
    return false;
  } catch (error) {
    console.warn(`⚠️ Failed to add Ethereum event listener for ${event}:`, error);
    return false;
  }
}

/**
 * Safely remove event listeners from the Ethereum provider
 */
export function removeEthereumEventListener(
  event: string,
  handler: (...args: any[]) => void
): boolean {
  try {
    const provider = getEthereumProvider();
    if (provider && typeof provider.removeListener === 'function') {
      provider.removeListener(event, handler);
      return true;
    }
    console.warn(`⚠️ Cannot remove event listener for ${event}: provider does not support events`);
    return false;
  } catch (error) {
    console.warn(`⚠️ Failed to remove Ethereum event listener for ${event}:`, error);
    return false;
  }
}

/**
 * Safely make requests to the Ethereum provider
 */
export async function requestFromEthereum(
  method: string,
  params?: any[]
): Promise<any> {
  try {
    const provider = getEthereumProvider();
    if (!provider) {
      throw new Error('No Ethereum provider available');
    }
    
    if (typeof provider.request !== 'function') {
      throw new Error('Ethereum provider does not support requests');
    }
    
    return await provider.request({ method, params });
  } catch (error) {
    console.error(`❌ Ethereum request failed for ${method}:`, error);
    throw error;
  }
}

/**
 * Check if the current provider is MetaMask
 */
export function isMetaMask(): boolean {
  try {
    const provider = getEthereumProvider();
    return !!(provider?.isMetaMask);
  } catch (error) {
    console.warn('⚠️ Error checking if provider is MetaMask:', error);
    return false;
  }
}

/**
 * Get the current chain ID from the provider
 */
export function getCurrentChainId(): string | null {
  try {
    const provider = getEthereumProvider();
    return provider?.chainId || null;
  } catch (error) {
    console.warn('⚠️ Error getting current chain ID:', error);
    return null;
  }
}

/**
 * Get the currently selected address from the provider
 */
export function getSelectedAddress(): string | null {
  try {
    const provider = getEthereumProvider();
    return provider?.selectedAddress || null;
  } catch (error) {
    console.warn('⚠️ Error getting selected address:', error);
    return null;
  }
}

/**
 * Check if the provider is connected
 */
export function isProviderConnected(): boolean {
  try {
    const provider = getEthereumProvider();
    if (provider && typeof provider.isConnected === 'function') {
      return provider.isConnected();
    }
    // Fallback: check if we have a selected address
    return !!getSelectedAddress();
  } catch (error) {
    console.warn('⚠️ Error checking provider connection:', error);
    return false;
  }
}

/**
 * Detect available wallet providers
 */
export function detectWalletProviders(): {
  hasMetaMask: boolean;
  hasEthereum: boolean;
  providerInfo: {
    isMetaMask?: boolean;
    chainId?: string;
    selectedAddress?: string;
    isConnected?: boolean;
  };
} {
  const hasEthereum = isEthereumAvailable();
  const hasMetaMask = isMetaMask();
  
  return {
    hasMetaMask,
    hasEthereum,
    providerInfo: {
      isMetaMask: hasMetaMask,
      chainId: getCurrentChainId(),
      selectedAddress: getSelectedAddress(),
      isConnected: isProviderConnected(),
    },
  };
}

/**
 * Safe wrapper for window.ethereum operations
 * Provides a consistent interface that handles errors gracefully
 */
export class SafeEthereumProvider {
  private provider: EthereumProvider | null;
  
  constructor() {
    this.provider = getEthereumProvider();
  }
  
  isAvailable(): boolean {
    return !!this.provider;
  }
  
  async request(method: string, params?: any[]): Promise<any> {
    return requestFromEthereum(method, params);
  }
  
  on(event: string, handler: (...args: any[]) => void): boolean {
    return addEthereumEventListener(event, handler);
  }
  
  removeListener(event: string, handler: (...args: any[]) => void): boolean {
    return removeEthereumEventListener(event, handler);
  }
  
  getChainId(): string | null {
    return getCurrentChainId();
  }
  
  getSelectedAddress(): string | null {
    return getSelectedAddress();
  }
  
  isConnected(): boolean {
    return isProviderConnected();
  }
  
  isMetaMask(): boolean {
    return isMetaMask();
  }
}

// Export a singleton instance for convenience
export const safeEthereum = new SafeEthereumProvider();