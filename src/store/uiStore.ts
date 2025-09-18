import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

export interface LoadingState {
  global: boolean;
  wallet: boolean;
  performers: boolean;
  tip: boolean;
  upload: boolean;
  [key: string]: boolean;
}

export interface ModalState {
  type: string | null;
  data: Record<string, unknown>;
  isOpen: boolean;
}

export interface UIState {
  // Loading states
  loading: LoadingState;
  
  // Notifications
  notifications: NotificationState[];
  
  // Modals
  modal: ModalState;
  
  // Navigation
  sidebarOpen: boolean;
  currentPage: string;
  
  // Mobile specific
  mobileNavOpen: boolean;
  swipeDirection: 'left' | 'right' | null;
  
  // Form states
  formErrors: Record<string, string[]>;
  formTouched: Record<string, boolean>;
  
  // UI preferences (not persisted)
  theme: 'dark' | 'light' | 'auto';
  reduceMotion: boolean;
}

export interface UIActions {
  // Loading actions
  setLoading: (key: keyof LoadingState, isLoading: boolean) => void;
  setGlobalLoading: (isLoading: boolean) => void;
  
  // Notification actions
  showNotification: (notification: Omit<NotificationState, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Modal actions
  openModal: (type: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  // Navigation actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  setMobileNavOpen: (open: boolean) => void;
  setSwipeDirection: (direction: 'left' | 'right' | null) => void;
  
  // Form actions
  setFormError: (field: string, errors: string[]) => void;
  clearFormError: (field: string) => void;
  setFormTouched: (field: string, touched: boolean) => void;
  resetForm: () => void;
  
  // UI preference actions
  setTheme: (theme: UIState['theme']) => void;
  setReduceMotion: (reduce: boolean) => void;
}

export interface UIStore extends UIState, UIActions {}

const initialLoadingState: LoadingState = {
  global: false,
  wallet: false,
  performers: false,
  tip: false,
  upload: false,
};

const initialUIState: UIState = {
  loading: initialLoadingState,
  notifications: [],
  modal: {
    type: null,
    data: {},
    isOpen: false,
  },
  sidebarOpen: false,
  currentPage: '/',
  mobileNavOpen: false,
  swipeDirection: null,
  formErrors: {},
  formTouched: {},
  theme: 'dark',
  reduceMotion: false,
};

let notificationId = 0;

export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ({
      // State
      ...initialUIState,

      // Loading actions
      setLoading: (key, isLoading) => {
        set(
          (state) => ({
            loading: {
              ...state.loading,
              [key]: isLoading,
            },
          }),
          false,
          `loading/set${String(key).charAt(0).toUpperCase() + String(key).slice(1)}`
        );
      },

      setGlobalLoading: (isLoading) => {
        set(
          (state) => ({
            loading: {
              ...state.loading,
              global: isLoading,
            },
          }),
          false,
          'loading/setGlobal'
        );
      },

      // Notification actions
      showNotification: (notification) => {
        const id = `notification-${++notificationId}`;
        const newNotification: NotificationState = {
          ...notification,
          id,
          duration: notification.duration ?? 5000,
        };

        set(
          (state) => ({
            notifications: [...state.notifications, newNotification],
          }),
          false,
          'notifications/show'
        );

        // Auto-dismiss after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().dismissNotification(id);
          }, newNotification.duration);
        }
      },

      dismissNotification: (id) => {
        set(
          (state) => ({
            notifications: state.notifications.filter(n => n.id !== id),
          }),
          false,
          'notifications/dismiss'
        );
      },

      clearAllNotifications: () => {
        set(
          () => ({
            notifications: [],
          }),
          false,
          'notifications/clearAll'
        );
      },

      // Modal actions
      openModal: (type, data = {}) => {
        set(
          () => ({
            modal: {
              type,
              data,
              isOpen: true,
            },
          }),
          false,
          'modal/open'
        );
      },

      closeModal: () => {
        set(
          () => ({
            modal: {
              type: null,
              data: {},
              isOpen: false,
            },
          }),
          false,
          'modal/close'
        );
      },

      // Navigation actions
      setSidebarOpen: (open) => {
        set(
          () => ({ sidebarOpen: open }),
          false,
          'navigation/setSidebarOpen'
        );
      },

      setCurrentPage: (page) => {
        set(
          () => ({ currentPage: page }),
          false,
          'navigation/setCurrentPage'
        );
      },

      setMobileNavOpen: (open) => {
        set(
          () => ({ mobileNavOpen: open }),
          false,
          'navigation/setMobileNavOpen'
        );
      },

      setSwipeDirection: (direction) => {
        set(
          () => ({ swipeDirection: direction }),
          false,
          'navigation/setSwipeDirection'
        );

        // Auto-clear swipe direction after a short delay
        if (direction) {
          setTimeout(() => {
            get().setSwipeDirection(null);
          }, 300);
        }
      },

      // Form actions
      setFormError: (field, errors) => {
        set(
          (state) => ({
            formErrors: {
              ...state.formErrors,
              [field]: errors,
            },
          }),
          false,
          'form/setError'
        );
      },

      clearFormError: (field) => {
        set(
          (state) => {
            const newErrors = { ...state.formErrors };
            delete newErrors[field];
            return { formErrors: newErrors };
          },
          false,
          'form/clearError'
        );
      },

      setFormTouched: (field, touched) => {
        set(
          (state) => ({
            formTouched: {
              ...state.formTouched,
              [field]: touched,
            },
          }),
          false,
          'form/setTouched'
        );
      },

      resetForm: () => {
        set(
          () => ({
            formErrors: {},
            formTouched: {},
          }),
          false,
          'form/reset'
        );
      },

      // UI preference actions
      setTheme: (theme) => {
        set(
          () => ({ theme }),
          false,
          'ui/setTheme'
        );
      },

      setReduceMotion: (reduce) => {
        set(
          () => ({ reduceMotion: reduce }),
          false,
          'ui/setReduceMotion'
        );
      },
    }),
    {
      name: 'megavibe-ui-store',
    }
  )
);

// Selectors for optimized access
export const useLoadingState = () => useUIStore((state) => state.loading);
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useModal = () => useUIStore((state) => state.modal);
export const useNavigation = () => useUIStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  currentPage: state.currentPage,
  mobileNavOpen: state.mobileNavOpen,
  swipeDirection: state.swipeDirection,
}));

// Action selectors
export const useLoadingActions = () => useUIStore((state) => ({
  setLoading: state.setLoading,
  setGlobalLoading: state.setGlobalLoading,
}));

export const useNotificationActions = () => useUIStore((state) => ({
  show: state.showNotification,
  dismiss: state.dismissNotification,
  clearAll: state.clearAllNotifications,
}));

export const useModalActions = () => useUIStore((state) => ({
  open: state.openModal,
  close: state.closeModal,
}));

export const useNavigationActions = () => useUIStore((state) => ({
  setSidebarOpen: state.setSidebarOpen,
  setCurrentPage: state.setCurrentPage,
  setMobileNavOpen: state.setMobileNavOpen,
  setSwipeDirection: state.setSwipeDirection,
}));

export const useFormActions = () => useUIStore((state) => ({
  setError: state.setFormError,
  clearError: state.clearFormError,
  setTouched: state.setFormTouched,
  reset: state.resetForm,
}));