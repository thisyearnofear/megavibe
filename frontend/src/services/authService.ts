// MetaMask SDK Primary Authentication Service
// Implements wallet-first authentication with fallback options

import { ethers } from 'ethers';
import env from '../config/environment';

export interface AuthUser {
  id: string;
  address: string;
  authMethod: 'metamask' | 'dynamic' | 'social';
  isAuthenticated: boolean;
  profile?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  reputation?: number;
  sessionToken?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface SignatureAuthRequest {
  address: string;
  signature: string;
  message: string;
  timestamp: number;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    this.loadPersistedAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const state: AuthState = {
      user: this.currentUser,
      isLoading: false,
      isAuthenticated: !!this.currentUser,
      error: null,
    };
    this.listeners.forEach(listener => listener(state));
  }

  // Generate authentication message for signature
  private generateAuthMessage(address: string, timestamp: number): string {
    return `Welcome to MegaVibe!

This signature proves you own this wallet address and allows you to authenticate securely.

Address: ${address}
Timestamp: ${timestamp}
Nonce: ${Math.random().toString(36).substring(7)}

By signing this message, you agree to MegaVibe's Terms of Service.`;
  }

  // MetaMask SDK Primary Authentication
  async authenticateWithMetaMask(sdk: any, provider: any): Promise<AuthUser> {
    try {
      if (!sdk || !provider) {
        throw new Error('MetaMask SDK not available');
      }

      // Connect to MetaMask
      const accounts = await sdk.connect();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in MetaMask');
      }

      const address = accounts[0];
      const timestamp = Date.now();
      const message = this.generateAuthMessage(address, timestamp);

      // Request signature for authentication
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Verify signature and create session
      const authRequest: SignatureAuthRequest = {
        address,
        signature,
        message,
        timestamp,
      };

      const user = await this.verifySignatureAndCreateSession(authRequest, 'metamask');
      
      this.currentUser = user;
      this.persistAuth(user);
      this.notifyListeners();

      return user;
    } catch (error) {
      console.error('MetaMask authentication failed:', error);
      throw error;
    }
  }

  // Dynamic.xyz Fallback Authentication
  async authenticateWithDynamic(dynamicUser: any, primaryWallet: any): Promise<AuthUser> {
    try {
      if (!dynamicUser || !primaryWallet) {
        throw new Error('Dynamic user or wallet not available');
      }

      const address = primaryWallet.address;
      const user: AuthUser = {
        id: dynamicUser.userId || address,
        address,
        authMethod: 'dynamic',
        isAuthenticated: true,
        profile: {
          name: dynamicUser.alias || dynamicUser.email?.split('@')[0],
          email: dynamicUser.email,
          avatar: dynamicUser.metadata?.avatar,
        },
      };

      // Get session token from backend
      const sessionResponse = await this.createBackendSession(user);
      user.sessionToken = sessionResponse.token;

      this.currentUser = user;
      this.persistAuth(user);
      this.notifyListeners();

      return user;
    } catch (error) {
      console.error('Dynamic authentication failed:', error);
      throw error;
    }
  }

  // Social Login Fallback (for non-crypto users)
  async authenticateWithSocial(provider: string, userData: any): Promise<AuthUser> {
    try {
      const user: AuthUser = {
        id: userData.id || userData.email,
        address: '', // No wallet address for social users
        authMethod: 'social',
        isAuthenticated: true,
        profile: {
          name: userData.name,
          email: userData.email,
          avatar: userData.picture || userData.avatar,
        },
      };

      // Create backend session for social users
      const sessionResponse = await this.createBackendSession(user);
      user.sessionToken = sessionResponse.token;

      this.currentUser = user;
      this.persistAuth(user);
      this.notifyListeners();

      return user;
    } catch (error) {
      console.error('Social authentication failed:', error);
      throw error;
    }
  }

  // Verify signature and create session with backend
  private async verifySignatureAndCreateSession(
    authRequest: SignatureAuthRequest, 
    authMethod: 'metamask' | 'dynamic'
  ): Promise<AuthUser> {
    try {
      // Verify signature locally first
      const recoveredAddress = ethers.verifyMessage(authRequest.message, authRequest.signature);
      
      if (recoveredAddress.toLowerCase() !== authRequest.address.toLowerCase()) {
        throw new Error('Signature verification failed');
      }

      // Send to backend for session creation and user lookup/creation
      const response = await fetch(`${env.api.url}/api/auth/wallet-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: authRequest.address,
          signature: authRequest.signature,
          message: authRequest.message,
          timestamp: authRequest.timestamp,
          authMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      const data = await response.json();
      
      const user: AuthUser = {
        id: data.user.id || authRequest.address,
        address: authRequest.address,
        authMethod,
        isAuthenticated: true,
        profile: data.user.profile || {},
        reputation: data.user.reputation || 0,
        sessionToken: data.sessionToken,
      };

      return user;
    } catch (error) {
      console.error('Signature verification failed:', error);
      throw error;
    }
  }

  // Create backend session for non-wallet auth
  private async createBackendSession(user: AuthUser): Promise<{ token: string }> {
    try {
      const response = await fetch(`${env.api.url}/api/auth/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          authMethod: user.authMethod,
          profile: user.profile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create backend session');
      }

      return await response.json();
    } catch (error) {
      console.error('Backend session creation failed:', error);
      throw error;
    }
  }

  // Get current authenticated user
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser && this.currentUser.isAuthenticated;
  }

  // Check if user has wallet (crypto-enabled)
  hasWallet(): boolean {
    return !!this.currentUser && !!this.currentUser.address;
  }

  // Get auth method priority for UI
  getAuthMethodPriority(): ('metamask' | 'dynamic' | 'social')[] {
    return ['metamask', 'dynamic', 'social'];
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Notify backend of logout
      if (this.currentUser?.sessionToken) {
        await fetch(`${env.api.url}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.currentUser.sessionToken}`,
            'Content-Type': 'application/json',
          },
        });
      }

      this.currentUser = null;
      this.clearPersistedAuth();
      this.notifyListeners();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if backend call fails
      this.currentUser = null;
      this.clearPersistedAuth();
      this.notifyListeners();
    }
  }

  // Persist authentication state
  private persistAuth(user: AuthUser): void {
    try {
      localStorage.setItem('megavibe_auth', JSON.stringify({
        user,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to persist auth state:', error);
    }
  }

  // Load persisted authentication state
  private loadPersistedAuth(): void {
    try {
      const stored = localStorage.getItem('megavibe_auth');
      if (stored) {
        const { user, timestamp } = JSON.parse(stored);

        // Check if auth is still valid (24 hours)
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;

        if (!isExpired && user) {
          this.currentUser = user;
        } else {
          this.clearPersistedAuth();
        }
      }
    } catch (error) {
      console.error('Failed to load persisted auth:', error);
      this.clearPersistedAuth();
    }
  }

  // Clear persisted authentication state
  private clearPersistedAuth(): void {
    try {
      localStorage.removeItem('megavibe_auth');
    } catch (error) {
      console.error('Failed to clear persisted auth:', error);
    }
  }

  // Get authentication headers for API calls
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.currentUser?.sessionToken) {
      headers['Authorization'] = `Bearer ${this.currentUser.sessionToken}`;
    }

    return headers;
  }

  // Refresh user data from backend
  async refreshUser(): Promise<AuthUser | null> {
    try {
      if (!this.currentUser?.sessionToken) {
        return null;
      }

      const response = await fetch(`${env.api.url}/api/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh user data');
      }

      const userData = await response.json();

      if (this.currentUser) {
        this.currentUser = {
          ...this.currentUser,
          ...userData.user,
        };
        this.persistAuth(this.currentUser);
        this.notifyListeners();
      }

      return this.currentUser;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  }
}

export const authService = AuthService.getInstance();
export default authService;
