/**
 * StateService.ts
 * 
 * Service for managing application state using Redux,
 * providing a unified interface for state operations.
 */

import { BaseService, ServiceResponse, ErrorCode } from './BaseService';
import { 
  AnyAction, 
  ThunkAction, 
  configureStore, 
  createSlice, 
  PayloadAction,
  combineReducers,
  Middleware,
  CaseReducer
} from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import logger from 'redux-logger';
import StorageService, { StorageType } from './StorageService';
import ConfigService from './ConfigService';

// Create store first so we can export types based on it
const initialReducers = {};
export const store = configureStore({
  reducer: combineReducers(initialReducers),
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false
    })
});

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  Promise<ReturnType>,
  RootState,
  unknown,
  AnyAction
>;

// Redux middleware options
export interface StateMiddlewareOptions {
  logger?: boolean;
  persistence?: boolean;
  devTools?: boolean;
  custom?: Middleware[];
}

// State persistence configuration
export interface StatePersistenceConfig {
  enabled: boolean;
  key: string;
  whitelist?: string[];
  blacklist?: string[];
  throttle?: number; // ms
  version?: number;
  migrate?: (state: any, version: number) => any;
}

// Redux slice configuration with persistence options
export interface SliceConfig<T> {
  name: string;
  initialState: T;
  reducers: Record<string, CaseReducer<T, PayloadAction<any>>>;
  persist?: boolean | Partial<StatePersistenceConfig>;
}

// Initial state of the application
export interface AppState {
  // Core state slices
  auth: AuthState;
  ui: UIState;
  entities: EntitiesState;
  
  // Feature-specific slices can be added as needed
  tipping?: TippingState;
  events?: EventsState;
  reputation?: ReputationState;
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id?: string;
    address?: string;
    username?: string;
    email?: string;
    profileImage?: string;
    groups?: string[];
  } | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  chainId: number | null;
}

// UI state
export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebar: {
    isOpen: boolean;
    width: number;
  };
  modals: Record<string, boolean>;
  notifications: Notification[];
  activeTab: string;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

// Notification structure
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  timestamp: number;
  read: boolean;
  autoDismiss?: boolean;
  duration?: number;
}

// Entities state (normalized data store)
export interface EntitiesState {
  events: Record<string, Event>;
  speakers: Record<string, Speaker>;
  venues: Record<string, Venue>;
  tips: Record<string, Tip>;
  bounties: Record<string, Bounty>;
}

// Tipping state
export interface TippingState {
  history: string[]; // IDs of tips
  pendingTips: Record<string, PendingTip>;
  statistics: {
    totalSent: number;
    totalReceived: number;
    lastUpdated: number;
  };
}

// Pending tip
export interface PendingTip {
  id: string;
  speakerId: string;
  eventId: string;
  amount: number;
  message?: string;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  txHash?: string;
  timestamp: number;
  error?: string;
}

// Events state
export interface EventsState {
  activeEvent: string | null;
  nearbyEvents: string[];
  upcomingEvents: string[];
  pastEvents: string[];
  isLoadingEvents: boolean;
  filters: {
    dateRange?: [Date, Date];
    category?: string;
    location?: {
      lat: number;
      lng: number;
      radius: number;
    };
    searchTerm?: string;
  };
}

// Reputation state
export interface ReputationState {
  scores: {
    overall: number;
    dimensions: Record<string, number>;
  };
  history: {
    timestamps: number[];
    values: number[];
  };
  achievements: Achievement[];
  isLoading: boolean;
}

// Achievement
export interface Achievement {
  id: string;
  name: string;
  description: string;
  image: string;
  unlockedAt?: number;
  progress?: number;
  threshold?: number;
}

// Domain entities
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venueId: string;
  speakers: string[];
  categories: string[];
  imageUrl?: string;
  attendance?: number;
}

export interface Speaker {
  id: string;
  name: string;
  bio?: string;
  events: string[];
  walletAddress: string;
  profileImage?: string;
  socialLinks?: Record<string, string>;
  expertise?: string[];
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity?: number;
  amenities?: string[];
  imageUrl?: string;
}

export interface Tip {
  id: string;
  senderId: string;
  recipientId: string;
  eventId: string;
  amount: number;
  currency: string;
  message?: string;
  timestamp: number;
  txHash: string;
}

export interface Bounty {
  id: string;
  creatorId: string;
  eventId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  deadline: string;
  status: 'open' | 'claimed' | 'completed' | 'cancelled';
  claimedBy?: string;
  submissions?: BountySubmission[];
}

export interface BountySubmission {
  id: string;
  bountyId: string;
  userId: string;
  content: string;
  submittedAt: number;
  status: 'pending' | 'accepted' | 'rejected';
  feedback?: string;
}

// Create the initial state
const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: null,
    chainId: null
  },
  ui: {
    theme: 'system',
    sidebar: {
      isOpen: true,
      width: 250
    },
    modals: {},
    notifications: [],
    activeTab: 'home',
    loading: {},
    errors: {}
  },
  entities: {
    events: {},
    speakers: {},
    venues: {},
    tips: {},
    bounties: {}
  }
};

// Default persistence configuration
const DEFAULT_PERSISTENCE_CONFIG: StatePersistenceConfig = {
  enabled: true,
  key: 'megavibe_state',
  throttle: 1000,
  version: 1
};

class StateServiceClass extends BaseService {
  private persistenceConfig: StatePersistenceConfig;
  private persistenceTimer: ReturnType<typeof setTimeout> | null = null;
  private slices: Record<string, ReturnType<typeof createSlice>> = {};

  constructor() {
    super('StateService');
    
    this.persistenceConfig = {
      ...DEFAULT_PERSISTENCE_CONFIG,
      whitelist: ['auth', 'ui']
    };
  }

  /**
   * Initialize the state service and create the Redux store
   */
  public async initialize(
    initialState?: Partial<AppState>,
    middlewareOptions: StateMiddlewareOptions = {
      logger: import.meta.env.DEV,
      persistence: true,
      devTools: import.meta.env.DEV
    }
  ): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      // Register core slices
      this.registerAuthSlice();
      this.registerUISlice();
      this.registerEntitiesSlice();
      
      // Load persisted state if enabled
      let preloadedState = initialState || {};
      
      if (middlewareOptions.persistence) {
        const persistedState = await this.loadPersistedState();
        if (persistedState) {
          preloadedState = this.deepMerge(preloadedState, persistedState);
        }
      }
      
      // Set up persistence if enabled
      if (middlewareOptions.persistence) {
        this.setupStatePersistence();
      }
      
      this.logInfo('StateService initialized');
      return true;
    }, 'Failed to initialize StateService');
  }

  /**
   * Get the Redux store instance
   */
  public getStore() {
    return store;
  }

  /**
   * Get the current state
   */
  public getState<T = RootState>(): T {
    return store.getState() as unknown as T;
  }

  /**
   * Dispatch an action
   */
  public dispatch<R>(action: AnyAction | AppThunk<R>): Promise<R> | R {
    return store.dispatch(action as any) as any;
  }

  /**
   * Register a slice with the store
   */
  public registerSlice<T>(config: SliceConfig<T>): ReturnType<typeof createSlice> {
    // Create the slice
    const slice = createSlice({
      name: config.name,
      initialState: config.initialState,
      reducers: config.reducers
    });
    
    // Store the slice
    this.slices[config.name] = slice;
    
    // Update persistence config if needed
    if (config.persist) {
      if (typeof config.persist === 'boolean') {
        if (config.persist && !this.persistenceConfig.whitelist?.includes(config.name)) {
          this.persistenceConfig.whitelist = [
            ...(this.persistenceConfig.whitelist || []),
            config.name
          ];
        }
      } else {
        // Merge custom persistence config
        this.persistenceConfig = {
          ...this.persistenceConfig,
          ...config.persist
        };
      }
    }
    
    // Update the root reducer
    const reducers = { ...initialReducers };
    Object.entries(this.slices).forEach(([name, sliceObj]) => {
      reducers[name] = sliceObj.reducer;
    });
    
    // Replace the root reducer
    store.replaceReducer(combineReducers(reducers));
    
    this.logInfo(`Slice "${config.name}" registered`);
    return slice;
  }

  /**
   * Register auth slice
   */
  private registerAuthSlice(): void {
    this.registerSlice<AuthState>({
      name: 'auth',
      initialState: initialState.auth,
      reducers: {
        loginStart: (state) => {
          state.isLoading = true;
          state.error = null;
        },
        loginSuccess: (state, action: PayloadAction<{ user: AuthState['user']; token: string }>) => {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isLoading = false;
          state.error = null;
        },
        loginFailure: (state, action: PayloadAction<string>) => {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.isLoading = false;
          state.error = action.payload;
        },
        logout: (state) => {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.isLoading = false;
          state.error = null;
        },
        updateUser: (state, action: PayloadAction<Partial<AuthState['user']>>) => {
          if (state.user) {
            state.user = { ...state.user, ...action.payload };
          }
        },
        setChainId: (state, action: PayloadAction<number>) => {
          state.chainId = action.payload;
        },
        resetState: (state) => {
          Object.assign(state, initialState.auth);
        }
      },
      persist: true
    });
  }

  /**
   * Register UI slice
   */
  private registerUISlice(): void {
    this.registerSlice<UIState>({
      name: 'ui',
      initialState: initialState.ui,
      reducers: {
        setTheme: (state, action: PayloadAction<UIState['theme']>) => {
          state.theme = action.payload;
        },
        toggleSidebar: (state) => {
          state.sidebar.isOpen = !state.sidebar.isOpen;
        },
        setSidebarWidth: (state, action: PayloadAction<number>) => {
          state.sidebar.width = action.payload;
        },
        showModal: (state, action: PayloadAction<string>) => {
          state.modals[action.payload] = true;
        },
        hideModal: (state, action: PayloadAction<string>) => {
          state.modals[action.payload] = false;
        },
        addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
          const notification: Notification = {
            id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            read: false,
            ...action.payload
          };
          
          state.notifications.push(notification);
          
          // Limit notifications to 100
          if (state.notifications.length > 100) {
            state.notifications.shift();
          }
        },
        removeNotification: (state, action: PayloadAction<string>) => {
          state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },
        markNotificationAsRead: (state, action: PayloadAction<string>) => {
          const notification = state.notifications.find(n => n.id === action.payload);
          if (notification) {
            notification.read = true;
          }
        },
        clearNotifications: (state) => {
          state.notifications = [];
        },
        setActiveTab: (state, action: PayloadAction<string>) => {
          state.activeTab = action.payload;
        },
        setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
          state.loading[action.payload.key] = action.payload.isLoading;
        },
        setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
          state.errors[action.payload.key] = action.payload.error;
        },
        resetState: (state) => {
          Object.assign(state, initialState.ui);
        }
      },
      persist: {
        enabled: true,
        whitelist: ['theme', 'sidebar']
      }
    });
  }

  /**
   * Register entities slice
   */
  private registerEntitiesSlice(): void {
    this.registerSlice<EntitiesState>({
      name: 'entities',
      initialState: initialState.entities,
      reducers: {
        addEntity: (state, action: PayloadAction<{ entityType: keyof EntitiesState; entity: any }>) => {
          const { entityType, entity } = action.payload;
          (state[entityType] as Record<string, any>)[entity.id] = entity;
        },
        updateEntity: (state, action: PayloadAction<{ entityType: keyof EntitiesState; id: string; changes: any }>) => {
          const { entityType, id, changes } = action.payload;
          const entityMap = state[entityType] as Record<string, any>;
          
          if (entityMap[id]) {
            entityMap[id] = { ...entityMap[id], ...changes };
          }
        },
        removeEntity: (state, action: PayloadAction<{ entityType: keyof EntitiesState; id: string }>) => {
          const { entityType, id } = action.payload;
          const entityMap = state[entityType] as Record<string, any>;
          
          delete entityMap[id];
        },
        clearEntities: (state, action: PayloadAction<keyof EntitiesState>) => {
          const entityType = action.payload;
          state[entityType] = {} as any;
        },
        resetState: (state) => {
          Object.assign(state, initialState.entities);
        }
      },
      persist: false
    });
  }

  /**
   * Set up state persistence
   */
  private setupStatePersistence(): void {
    // Subscribe to store changes
    store.subscribe(() => {
      // Throttle persistence to avoid excessive writes
      if (this.persistenceTimer) {
        clearTimeout(this.persistenceTimer);
      }
      
      this.persistenceTimer = setTimeout(() => {
        this.persistState();
      }, this.persistenceConfig.throttle || 1000);
    });
    
    this.logInfo('State persistence enabled');
  }

  /**
   * Persist state to storage
   */
  private async persistState(): Promise<void> {
    try {
      if (!this.persistenceConfig.enabled) {
        return;
      }
      
      const state = store.getState();
      let persistedState: Record<string, any> = {};
      
      // Filter state based on whitelist/blacklist
      if (this.persistenceConfig.whitelist) {
        this.persistenceConfig.whitelist.forEach(key => {
          if (state[key] !== undefined) {
            persistedState[key] = state[key];
          }
        });
      } else if (this.persistenceConfig.blacklist) {
        Object.entries(state).forEach(([key, value]) => {
          if (!this.persistenceConfig.blacklist?.includes(key)) {
            persistedState[key] = value;
          }
        });
      } else {
        persistedState = state;
      }
      
      // Add version information
      const persistData = {
        version: this.persistenceConfig.version || 1,
        state: persistedState
      };
      
      // Save to storage
      await StorageService.setItem(
        this.persistenceConfig.key,
        persistData,
        { type: StorageType.LOCAL }
      );
    } catch (error) {
      this.logError('Failed to persist state', error);
    }
  }

  /**
   * Load persisted state from storage
   */
  private async loadPersistedState(): Promise<Partial<AppState> | null> {
    try {
      if (!this.persistenceConfig.enabled) {
        return null;
      }
      
      const response = await StorageService.getItem<{ version: number; state: Partial<AppState> }>(
        this.persistenceConfig.key,
        { type: StorageType.LOCAL }
      );
      
      if (!response.success || !response.data) {
        return null;
      }
      
      const { version, state } = response.data;
      
      // Handle migrations
      if (version !== this.persistenceConfig.version && this.persistenceConfig.migrate) {
        return this.persistenceConfig.migrate(state, version);
      }
      
      return state;
    } catch (error) {
      this.logError('Failed to load persisted state', error);
      return null;
    }
  }

  /**
   * Create a thunk action
   */
  public createThunk<R = void, A extends any[] = any[]>(
    name: string,
    thunkFn: (...args: A) => AppThunk<R>
  ): (...args: A) => AppThunk<R> {
    return thunkFn;
  }

  /**
   * Clear persisted state
   */
  public async clearPersistedState(): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      await StorageService.removeItem(
        this.persistenceConfig.key,
        { type: StorageType.LOCAL }
      );
      
      this.logInfo('Persisted state cleared');
      return true;
    }, 'Failed to clear persisted state');
  }

  /**
   * Reset store to initial state
   */
  public resetStore(): void {
    // Reset each slice to its initial state
    Object.entries(this.slices).forEach(([name, slice]) => {
      // Find reset action
      const resetAction = Object.entries(slice.actions).find(([actionName]) => 
        actionName.toLowerCase().includes('reset')
      );
      
      if (resetAction && typeof resetAction[1] === 'function') {
        store.dispatch(resetAction[1](undefined)); // Pass undefined to satisfy TS
      } else {
        this.logInfo(`No reset action found for slice "${name}"`);
      }
    });
    
    this.logInfo('Store reset to initial state');
  }

  /**
   * Deep merge objects
   */
  private deepMerge<T>(target: any, source: any): T {
    const output = { ...target };
    
    if (target && source && typeof target === 'object' && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        if (
          source[key] && 
          typeof source[key] === 'object' && 
          target[key] && 
          typeof target[key] === 'object' &&
          !Array.isArray(source[key]) &&
          !Array.isArray(target[key])
        ) {
          output[key] = this.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output as T;
  }
}

// Export singleton instance
const StateService = new StateServiceClass();
export default StateService;

// Export hooks for easy usage
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;