// Unified type definitions for all state slices

export interface WalletState {
  isConnected: boolean;
  address: string;
  chainId: number;
  isSupported: boolean;
  balance: {
    mnt: string;
    formatted: string;
  };
  isInitialized: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
}

export interface UserState {
  profile: {
    name?: string;
    avatar?: string;
    type: 'performer' | 'audience' | 'creator';
    reputation: number;
  } | null;
  preferences: {
    notifications: boolean;
    haptics: boolean;
    theme: 'dark' | 'light' | 'auto';
    language: string;
  };
  location: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    hasPermission: boolean;
  };
}

export interface PerformanceState {
  currentPerformers: Performer[];
  nearbyPerformers: Performer[];
  favoritePerformers: string[];
  recentlyViewed: string[];
  filters: {
    genre?: string[];
    location?: string;
    status?: 'live' | 'break' | 'finished' | 'offline';
    distance?: number;
  };
}

export interface Performer {
  id: string;
  name: string;
  type: string;
  genres: string[];
  avatar?: string;
  isLive: boolean;
  status: 'live' | 'break' | 'finished' | 'offline';
  location: {
    venue?: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  distance?: string;
  reputation: number;
  tipAmount?: string;
  description?: string;
}

export interface AppState {
  // State slices
  wallet: WalletState;
  user: UserState;
  performance: PerformanceState;
}

export interface AppActions {
  // Wallet actions
  setWalletConnectionStatus: (status: WalletState['connectionStatus']) => void;
  updateWalletInfo: (info: Partial<WalletState>) => void;
  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  
  // User actions
  updateUserProfile: (profile: UserState['profile']) => void;
  updateUserPreferences: (preferences: Partial<UserState['preferences']>) => void;
  updateUserLocation: (location: Partial<UserState['location']>) => void;
  
  // Performance actions
  setCurrentPerformers: (performers: Performer[]) => void;
  setNearbyPerformers: (performers: Performer[]) => void;
  addFavoritePerformer: (performerId: string) => void;
  removeFavoritePerformer: (performerId: string) => void;
  addRecentlyViewedPerformer: (performerId: string) => void;
  updatePerformanceFilters: (filters: Partial<PerformanceState['filters']>) => void;
  refreshPerformers: () => Promise<void>;
}

// Combined store interface
export interface AppStore extends AppState, AppActions {}