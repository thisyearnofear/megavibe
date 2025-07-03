/**
 * TippingStateService.ts
 * 
 * Service for managing tipping-related state using Redux,
 * integrating the core TippingService with state management.
 */

import TippingServiceInstance from '../core/TippingService';
import StateService, { 
  AppThunk, 
  Tip,
  PendingTip,
  RootState, 
  TippingState
} from '../core/StateService';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { BaseService, ServiceResponse, ErrorCode } from '../core/BaseService';
import { v4 as uuidv4 } from 'uuid';

// Initial tipping state
const initialState: TippingState = {
  history: [],
  pendingTips: {},
  statistics: {
    totalSent: 0,
    totalReceived: 0,
    lastUpdated: 0
  }
};

class TippingStateServiceClass extends BaseService {
  private tippingService: typeof TippingServiceInstance;
  private slice: ReturnType<typeof createSlice>;

  constructor() {
    super('TippingStateService');
    
    // Use the singleton instance of TippingService
    this.tippingService = TippingServiceInstance;
    
    // Register the tipping slice
    this.slice = StateService.registerSlice({
      name: 'tipping',
      initialState,
      reducers: {
        // Tip history management
        setTipHistory: (state, action: PayloadAction<string[]>) => {
          state.history = action.payload;
        },
        addTipToHistory: (state, action: PayloadAction<string>) => {
          if (!state.history.includes(action.payload)) {
            state.history.unshift(action.payload); // Add to beginning for newest first
          }
        },
        
        // Pending tips management
        setPendingTips: (state, action: PayloadAction<Record<string, PendingTip>>) => {
          state.pendingTips = action.payload;
        },
        addPendingTip: (state, action: PayloadAction<PendingTip>) => {
          state.pendingTips[action.payload.id] = action.payload;
        },
        updatePendingTip: (state, action: PayloadAction<{ id: string; changes: Partial<PendingTip> }>) => {
          const { id, changes } = action.payload;
          if (state.pendingTips[id]) {
            state.pendingTips[id] = { ...state.pendingTips[id], ...changes };
          }
        },
        removePendingTip: (state, action: PayloadAction<string>) => {
          delete state.pendingTips[action.payload];
        },
        
        // Statistics management
        setStatistics: (state, action: PayloadAction<TippingState['statistics']>) => {
          state.statistics = action.payload;
        },
        updateStatistics: (state, action: PayloadAction<Partial<TippingState['statistics']>>) => {
          state.statistics = { ...state.statistics, ...action.payload };
        },
        
        // Reset state
        clearHistory: (state) => {
          state.history = [];
        },
        resetState: (state) => {
          Object.assign(state, initialState);
        }
      },
      // Persist tipping data
      persist: {
        enabled: true,
        whitelist: ['history', 'statistics']
      }
    });
    
    this.logInfo('TippingStateService initialized');
  }

  /**
   * Get actions from the slice
   */
  public get actions() {
    return this.slice.actions;
  }

  /**
   * Send a tip to a recipient
   */
  public sendTip = (
    recipientAddress: string,
    amount: number,
    eventId: string,
    message?: string,
    speakerId?: string
  ): AppThunk<ServiceResponse<string>> => {
    return async (dispatch, getState) => {
      try {
        // Create pending tip ID
        const pendingTipId = uuidv4();
        
        // Add to pending tips
        dispatch(this.actions.addPendingTip({
          id: pendingTipId,
          speakerId: speakerId || recipientAddress,
          eventId,
          amount,
          message,
          status: 'pending',
          timestamp: Date.now()
        }));
        
        // Call TippingService to send the tip
        const result = await this.tippingService.sendTip({
          recipientAddress,
          amount: amount.toString(),
          eventId,
          message: message || '',
          speakerId: speakerId || recipientAddress // Use provided speakerId or fall back to recipientAddress
        });
        
        if (!result.success) {
          // Update pending tip status to failed
          dispatch(this.actions.updatePendingTip({
            id: pendingTipId,
            changes: {
              status: 'failed',
              error: result.error?.message || 'Failed to send tip'
            }
          }));
          
          return {
            success: false,
            error: result.error,
            timestamp: Date.now()
          };
        }
        
        // Update pending tip status to completed
        dispatch(this.actions.updatePendingTip({
          id: pendingTipId,
          changes: {
            status: 'completed',
            txHash: result.data
          }
        }));
        
        // Create and add tip to entities
        const tipId = `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTip: Tip = {
          id: tipId,
          senderId: (getState() as any).auth?.user?.address || 'unknown',
          recipientId: recipientAddress,
          eventId,
          amount,
          currency: 'USDC',
          message: message || '',
          timestamp: Date.now(),
          txHash: result.data
        };
        
        dispatch({
          type: 'entities/addEntity',
          payload: {
            entityType: 'tips',
            entity: newTip
          }
        });
        
        // Add tip to history
        dispatch(this.actions.addTipToHistory(tipId));
        
        // Update statistics
        const currentStats = (getState() as any).tipping?.statistics || initialState.statistics;
        dispatch(this.actions.updateStatistics({
          totalSent: currentStats.totalSent + amount,
          lastUpdated: Date.now()
        }));
        
        return {
          success: true,
          data: result.data,
          timestamp: Date.now()
        };
      } catch (error) {
        this.logError('Failed to send tip', error);
        
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to send tip',
            details: { error }
          },
          timestamp: Date.now()
        };
      }
    };
  };

  /**
   * Fetch tip history
   */
  public fetchTipHistory = (
    limit: number = 50
  ): AppThunk<ServiceResponse<Tip[]>> => {
    return async (dispatch, getState) => {
      try {
        // Get the user's address from state
        const userAddress = (getState() as any).auth?.user?.address;
        
        if (!userAddress) {
          return {
            success: false,
            error: {
              code: ErrorCode.UNAUTHORIZED,
              message: 'User not authenticated'
            },
            timestamp: Date.now()
          };
        }
        
        // In a real implementation, we would call the TippingService to get tip history
        // For now, we'll just return the tips we already have in state
        const state = getState() as any;
        const tipIds = state.tipping?.history || [];
        const tips = tipIds
          .map((id: string) => state.entities?.tips?.[id])
          .filter(Boolean) as Tip[];
        
        // If we have no tips in state yet, attempt to get some from the service
        if (tips.length === 0) {
          // This would call a method like:
          // const result = await this.tippingService.getUserTips(userAddress, limit);
          // But since that method doesn't exist yet, we'll create placeholder data
          
          // Placeholder: Create some mock tips for demo
          const mockTips: Tip[] = [];
          const recipients = [
            '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            '0x5a7Ed99f38d4F8Df5a6182D56594A1C64d970983',
            '0x9A5942D8D6337A0B31F4Dad91A15D5aE6b8fAa8E'
          ];
          
          for (let i = 0; i < 3; i++) {
            const tipId = `tip_${Date.now() - i * 86400000}_${Math.random().toString(36).substr(2, 9)}`;
            const mockTip: Tip = {
              id: tipId,
              senderId: userAddress,
              recipientId: recipients[i % recipients.length],
              eventId: 'eth-denver-2025',
              amount: 5 + (i * 5),
              currency: 'USDC',
              message: i % 2 === 0 ? 'Great talk!' : 'Thanks for the insights!',
              timestamp: Date.now() - i * 86400000, // One day apart
              txHash: `0x${Math.random().toString(36).substr(2, 64)}`
            };
            
            mockTips.push(mockTip);
            
            // Add to entities
            dispatch({
              type: 'entities/addEntity',
              payload: {
                entityType: 'tips',
                entity: mockTip
              }
            });
          }
          
          // Update history with mock tip IDs
          dispatch(this.actions.setTipHistory(mockTips.map(tip => tip.id)));
          
          // Calculate statistics
          const totalSent = mockTips.reduce((sum, tip) => sum + tip.amount, 0);
          
          // Update statistics
          dispatch(this.actions.setStatistics({
            totalSent,
            totalReceived: 0, // We don't track received tips in this mock
            lastUpdated: Date.now()
          }));
          
          return {
            success: true,
            data: mockTips,
            timestamp: Date.now()
          };
        }
        
        return {
          success: true,
          data: tips,
          timestamp: Date.now()
        };
      } catch (error) {
        this.logError('Failed to fetch tip history', error);
        
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to fetch tip history',
            details: { error }
          },
          timestamp: Date.now()
        };
      }
    };
  };

  /**
   * Get tip by ID
   */
  public getTipById = (tipId: string): AppThunk<ServiceResponse<Tip | null>> => {
    return async (dispatch, getState) => {
      try {
        // Check if tip exists in entities
        const state = getState() as any;
        const tip = state.entities?.tips?.[tipId];
        
        if (tip) {
          return {
            success: true,
            data: tip,
            timestamp: Date.now()
          };
        }
        
        // In a real implementation, we would call the TippingService to get the tip
        // For now, we'll just return null
        
        return {
          success: true,
          data: null,
          timestamp: Date.now()
        };
      } catch (error) {
        this.logError('Failed to get tip by ID', error);
        
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to get tip by ID',
            details: { error }
          },
          timestamp: Date.now()
        };
      }
    };
  };

  /**
   * Clear tip history
   */
  public clearHistory(): void {
    // Clear tip history
    StateService.dispatch({
      type: 'tipping/clearHistory'
    });
  }

  /**
   * Get all tips
   */
  public getAllTips(): Tip[] {
    const state = StateService.getState() as any;
    return state.entities?.tips ? Object.values(state.entities.tips) : [];
  }

  /**
   * Get pending tips
   */
  public getPendingTips(): PendingTip[] {
    const state = StateService.getState() as any;
    return state.tipping?.pendingTips ? Object.values(state.tipping.pendingTips) : [];
  }

  /**
   * Get tipping statistics
   */
  public getStatistics(): TippingState['statistics'] {
    const state = StateService.getState() as any;
    return state.tipping?.statistics || initialState.statistics;
  }
}

// Export singleton instance
const TippingStateService = new TippingStateServiceClass();
export default TippingStateService;