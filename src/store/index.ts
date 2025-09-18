// Unified State Management with Zustand
// Consolidates all application state into a single, predictable store

// Main stores
export { 
  useAppStore,
  useWalletState,
  useUserState, 
  usePerformanceState,
  useWalletActions,
  useUserActions,
  usePerformanceActions 
} from './appStore';

export { 
  usePersistentStore,
  useOnboardingState,
  useImpactState,
  useOnboardingActions,
  useImpactActions 
} from './persistentStore';

export { 
  useUIStore,
  useLoadingState,
  useNotifications,
  useModal,
  useNavigation,
  useLoadingActions,
  useNotificationActions,
  useModalActions,
  useNavigationActions,
  useFormActions 
} from './uiStore';

// Re-export types for consumers
export type { 
  AppState, 
  AppActions,
  AppStore,
  WalletState, 
  UserState, 
  PerformanceState,
  Performer
} from './types';

export type { 
  PersistentState, 
  OnboardingState, 
  ImpactState 
} from './persistentStore';

export type { 
  UIState,
  UIActions,
  UIStore, 
  NotificationState, 
  LoadingState,
  ModalState 
} from './uiStore';