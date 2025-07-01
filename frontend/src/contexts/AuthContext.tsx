// MetaMask SDK Primary Authentication Context
// Provides wallet-first authentication with fallback options

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSDK } from '@metamask/sdk-react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import authService, { AuthUser, AuthState } from '../services/authService';

export interface AuthContextValue extends AuthState {
  // Primary authentication methods
  authenticateWithMetaMask: () => Promise<void>;
  authenticateWithDynamic: () => Promise<void>;
  authenticateWithSocial: (provider: string, userData: any) => Promise<void>;
  
  // Auth management
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utility methods
  hasWallet: () => boolean;
  getAuthMethodPriority: () => ('metamask' | 'dynamic' | 'social')[];
  
  // UI state
  isConnecting: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // MetaMask SDK hooks
  const { sdk, connected, connecting, provider } = useSDK();
  
  // Dynamic.xyz hooks
  const { 
    primaryWallet, 
    user: dynamicUser, 
    isAuthenticated: isDynamicAuthenticated,
    setShowAuthFlow 
  } = useDynamicContext();

  // Local state
  const [authState, setAuthState] = useState<AuthState>({
    user: authService.getCurrentUser(),
    isLoading: false,
    isAuthenticated: authService.isAuthenticated(),
    error: null,
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Subscribe to auth service changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((newState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, []);

  // Auto-authenticate with MetaMask if already connected
  useEffect(() => {
    const autoAuthenticateMetaMask = async () => {
      if (connected && provider && !authState.isAuthenticated && !isConnecting) {
        try {
          setIsConnecting(true);
          await authService.authenticateWithMetaMask(sdk, provider);
        } catch (error) {
          console.error('Auto MetaMask authentication failed:', error);
        } finally {
          setIsConnecting(false);
        }
      }
    };

    autoAuthenticateMetaMask();
  }, [connected, provider, sdk, authState.isAuthenticated, isConnecting]);

  // Auto-authenticate with Dynamic if authenticated but not in our auth service
  useEffect(() => {
    const autoAuthenticateDynamic = async () => {
      if (
        isDynamicAuthenticated && 
        dynamicUser && 
        primaryWallet && 
        !authState.isAuthenticated && 
        !isConnecting &&
        !connected // Only if MetaMask is not connected
      ) {
        try {
          setIsConnecting(true);
          await authService.authenticateWithDynamic(dynamicUser, primaryWallet);
        } catch (error) {
          console.error('Auto Dynamic authentication failed:', error);
        } finally {
          setIsConnecting(false);
        }
      }
    };

    autoAuthenticateDynamic();
  }, [
    isDynamicAuthenticated, 
    dynamicUser, 
    primaryWallet, 
    authState.isAuthenticated, 
    isConnecting,
    connected
  ]);

  // Primary MetaMask authentication
  const authenticateWithMetaMask = useCallback(async () => {
    try {
      setIsConnecting(true);
      setAuthState(prev => ({ ...prev, error: null }));

      if (!sdk) {
        throw new Error('MetaMask SDK not initialized');
      }

      await authService.authenticateWithMetaMask(sdk, provider);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error('MetaMask authentication failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message || 'MetaMask authentication failed' 
      }));
    } finally {
      setIsConnecting(false);
    }
  }, [sdk, provider]);

  // Dynamic.xyz fallback authentication
  const authenticateWithDynamic = useCallback(async () => {
    try {
      setIsConnecting(true);
      setAuthState(prev => ({ ...prev, error: null }));

      // Open Dynamic auth flow
      setShowAuthFlow(true);
      
      // The actual authentication will happen in the useEffect above
      // when Dynamic completes the authentication
    } catch (error: any) {
      console.error('Dynamic authentication failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message || 'Dynamic authentication failed' 
      }));
      setIsConnecting(false);
    }
  }, [setShowAuthFlow]);

  // Social login fallback
  const authenticateWithSocial = useCallback(async (provider: string, userData: any) => {
    try {
      setIsConnecting(true);
      setAuthState(prev => ({ ...prev, error: null }));

      await authService.authenticateWithSocial(provider, userData);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error('Social authentication failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message || 'Social authentication failed' 
      }));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsConnecting(true);
      await authService.logout();
      
      // Also disconnect from MetaMask and Dynamic if connected
      if (connected && sdk) {
        try {
          await sdk.disconnect();
        } catch (error) {
          console.error('MetaMask disconnect failed:', error);
        }
      }
      
      if (isDynamicAuthenticated) {
        try {
          // Dynamic logout is handled by their context
        } catch (error) {
          console.error('Dynamic logout failed:', error);
        }
      }
    } catch (error: any) {
      console.error('Logout failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message || 'Logout failed' 
      }));
    } finally {
      setIsConnecting(false);
    }
  }, [connected, sdk, isDynamicAuthenticated]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      await authService.refreshUser();
    } catch (error: any) {
      console.error('Refresh user failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to refresh user data' 
      }));
    }
  }, []);

  // Utility methods
  const hasWallet = useCallback(() => {
    return authService.hasWallet();
  }, []);

  const getAuthMethodPriority = useCallback(() => {
    return authService.getAuthMethodPriority();
  }, []);

  // Context value
  const contextValue: AuthContextValue = {
    ...authState,
    authenticateWithMetaMask,
    authenticateWithDynamic,
    authenticateWithSocial,
    logout,
    refreshUser,
    hasWallet,
    getAuthMethodPriority,
    isConnecting,
    showAuthModal,
    setShowAuthModal,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
