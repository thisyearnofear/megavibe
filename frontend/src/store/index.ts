/**
 * Redux Store Configuration
 * 
 * This file sets up and exports the Redux store with all configured slices,
 * middleware, and provides TypeScript type definitions for the store.
 */

import StateService, { RootState } from '../services/core/StateService';
import TippingStateService from '../services/state/TippingStateService';

// Re-export types from state service for convenience
export type { 
  RootState, 
  AppDispatch, 
  AppThunk, 
  AuthState, 
  UIState, 
  EntitiesState,
  TippingState,
  EventsState,
  ReputationState,
  Notification,
  Tip,
  PendingTip,
  Event,
  Speaker,
  Venue,
  Bounty
} from '../services/core/StateService';

/**
 * Initializes and configures the Redux store with all services
 */
export const setupStore = async () => {
  // Initialize the state service
  await StateService.initialize();
  
  // Return the store instance
  return StateService.getStore();
};

// Get the store instance
export const store = StateService.getStore();

// Export services for easy access
export const services = {
  state: StateService,
  tipping: TippingStateService
};