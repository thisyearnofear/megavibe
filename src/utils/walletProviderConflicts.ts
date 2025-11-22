/**
 * Utility to handle wallet provider conflicts
 * Addresses the "Cannot set property ethereum" errors from multiple wallet extensions
 */

export function handleWalletProviderConflicts() {
  if (typeof window === 'undefined') return;

  // Store original ethereum provider if it exists
  const originalEthereum = (window as any).ethereum;
  
  // Create a proxy to handle multiple wallet providers gracefully
  if (originalEthereum && !originalEthereum._isProxy) {
    const ethereumProxy = new Proxy(originalEthereum, {
      set(target, property, value, receiver) {
        // Allow setting properties but don't throw errors
        try {
          return Reflect.set(target, property, value, receiver);
        } catch (error) {
          console.warn(`Wallet provider conflict: Cannot set ${String(property)}`, error);
          return true; // Pretend it succeeded to prevent errors
        }
      },
      get(target, property, receiver) {
        return Reflect.get(target, property, receiver);
      }
    });
    
    // Mark as proxy to avoid double-wrapping
    ethereumProxy._isProxy = true;
    
    try {
      (window as any).ethereum = ethereumProxy;
    } catch (error) {
      console.warn('Could not set ethereum proxy:', error);
    }
  }
}

// Call this early in the app lifecycle
if (typeof window !== 'undefined') {
  // Handle conflicts as soon as possible
  handleWalletProviderConflicts();
  
  // Also handle when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleWalletProviderConflicts);
  }
}