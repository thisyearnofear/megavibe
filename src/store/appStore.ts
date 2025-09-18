import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppStore, WalletState, UserState, PerformanceState, Performer } from './types';
import { useWalletConnection } from '@/hooks/useWalletConnection';

// Initial state definitions
const initialWalletState: WalletState = {
  isConnected: false,
  address: '',
  chainId: 0,
  isSupported: false,
  balance: {
    mnt: '0',
    formatted: '0',
  },
  isInitialized: false,
  connectionStatus: 'idle',
};

const initialUserState: UserState = {
  profile: null,
  preferences: {
    notifications: true,
    haptics: true,
    theme: 'dark',
    language: 'en',
  },
  location: {
    hasPermission: false,
  },
};

const initialPerformanceState: PerformanceState = {
  currentPerformers: [],
  nearbyPerformers: [],
  favoritePerformers: [],
  recentlyViewed: [],
  filters: {},
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // State slices
      wallet: initialWalletState,
      user: initialUserState,
      performance: initialPerformanceState,

      // Wallet actions
      setWalletConnectionStatus: (status) => {
        set(
          (state) => ({
            wallet: { ...state.wallet, connectionStatus: status },
          }),
          false,
          'wallet/setConnectionStatus'
        );
      },

      updateWalletInfo: (info) => {
        set(
          (state) => ({
            wallet: { ...state.wallet, ...info },
          }),
          false,
          'wallet/updateInfo'
        );
      },

      connectWallet: async (walletType) => {
        const { setWalletConnectionStatus } = get();
        
        try {
          setWalletConnectionStatus('connecting');
          
          // This would integrate with the actual wallet connection logic
          // For now, we'll simulate the connection
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setWalletConnectionStatus('connected');
        } catch (error) {
          setWalletConnectionStatus('error');
          throw error;
        }
      },

      disconnectWallet: () => {
        set(
          () => ({
            wallet: { ...initialWalletState, isInitialized: true },
          }),
          false,
          'wallet/disconnect'
        );
      },

      switchNetwork: async (chainId) => {
        // Network switching logic would go here
        set(
          (state) => ({
            wallet: { ...state.wallet, chainId },
          }),
          false,
          'wallet/switchNetwork'
        );
      },

      // User actions
      updateUserProfile: (profile) => {
        set(
          (state) => ({
            user: {
              ...state.user,
              profile,
            },
          }),
          false,
          'user/updateProfile'
        );
      },

      updateUserPreferences: (preferences) => {
        set(
          (state) => ({
            user: {
              ...state.user,
              preferences: { ...state.user.preferences, ...preferences },
            },
          }),
          false,
          'user/updatePreferences'
        );
      },

      updateUserLocation: (location) => {
        set(
          (state) => ({
            user: {
              ...state.user,
              location: { ...state.user.location, ...location },
            },
          }),
          false,
          'user/updateLocation'
        );
      },

      // Performance actions
      setCurrentPerformers: (performers) => {
        set(
          (state) => ({
            performance: { ...state.performance, currentPerformers: performers },
          }),
          false,
          'performance/setCurrentPerformers'
        );
      },

      setNearbyPerformers: (performers) => {
        set(
          (state) => ({
            performance: { ...state.performance, nearbyPerformers: performers },
          }),
          false,
          'performance/setNearbyPerformers'
        );
      },

      addFavoritePerformer: (performerId) => {
        set(
          (state) => ({
            performance: {
              ...state.performance,
              favoritePerformers: [...state.performance.favoritePerformers, performerId],
            },
          }),
          false,
          'performance/addFavorite'
        );
      },

      removeFavoritePerformer: (performerId) => {
        set(
          (state) => ({
            performance: {
              ...state.performance,
              favoritePerformers: state.performance.favoritePerformers.filter(
                id => id !== performerId
              ),
            },
          }),
          false,
          'performance/removeFavorite'
        );
      },

      addRecentlyViewedPerformer: (performerId) => {
        set(
          (state) => {
            const recentlyViewed = [
              performerId,
              ...state.performance.recentlyViewed.filter(id => id !== performerId)
            ].slice(0, 10); // Keep only last 10

            return {
              performance: {
                ...state.performance,
                recentlyViewed,
              },
            };
          },
          false,
          'performance/addRecentlyViewed'
        );
      },

      updatePerformanceFilters: (filters) => {
        set(
          (state) => ({
            performance: {
              ...state.performance,
              filters: { ...state.performance.filters, ...filters },
            },
          }),
          false,
          'performance/updateFilters'
        );
      },

      refreshPerformers: async () => {
        // This would fetch fresh performer data
        // For now, we'll simulate the API call
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Simulate fetching performers
          const mockPerformers: Performer[] = [
            {
              id: '1',
              name: 'DJ Cosmic',
              type: 'Electronic Music',
              genres: ['Electronic', 'House'],
              isLive: true,
              status: 'live',
              location: {
                venue: 'Digital Stage',
                address: 'Virtual Space 1',
              },
              reputation: 4.8,
              tipAmount: '0.05',
            },
            // Add more mock performers as needed
          ];
          
          set(
            (state) => ({
              performance: {
                ...state.performance,
                currentPerformers: mockPerformers,
                nearbyPerformers: mockPerformers,
              },
            }),
            false,
            'performance/refreshPerformers'
          );
        } catch (error) {
          console.error('Failed to refresh performers:', error);
        }
      },
    }),
    {
      name: 'megavibe-app-store',
    }
  )
);

// Selectors for optimized state access
export const useWalletState = () => useAppStore((state) => state.wallet);
export const useUserState = () => useAppStore((state) => state.user);
export const usePerformanceState = () => useAppStore((state) => state.performance);

// Action selectors
export const useWalletActions = () => useAppStore((state) => ({
  setConnectionStatus: state.setWalletConnectionStatus,
  updateInfo: state.updateWalletInfo,
  connect: state.connectWallet,
  disconnect: state.disconnectWallet,
  switchNetwork: state.switchNetwork,
}));

export const useUserActions = () => useAppStore((state) => ({
  updateProfile: state.updateUserProfile,
  updatePreferences: state.updateUserPreferences,
  updateLocation: state.updateUserLocation,
}));

export const usePerformanceActions = () => useAppStore((state) => ({
  setCurrentPerformers: state.setCurrentPerformers,
  setNearbyPerformers: state.setNearbyPerformers,
  addFavorite: state.addFavoritePerformer,
  removeFavorite: state.removeFavoritePerformer,
  addRecentlyViewed: state.addRecentlyViewedPerformer,
  updateFilters: state.updatePerformanceFilters,
  refresh: state.refreshPerformers,
}));