/**
 * CrossChainStateService.ts
 * 
 * Manages the integration between CrossChainService and the Redux state.
 * Handles transaction tracking and state updates for cross-chain operations.
 */

import { BaseService, ServiceResponse } from '../core/BaseService';
import CrossChainService, { CrossChainStatus } from '../core/CrossChainService';
import StateService from '../core/StateService';
import ErrorHandlingService from '../core/ErrorHandlingService';
import ValidationService from '../core/ValidationService';

// Define the shape of a cross-chain transaction in the state
export interface CrossChainTransaction {
  id: string;
  sourceChain: number;
  destinationChain: number;
  amount: number;
  recipientAddress: string;
  status: string;
  txHash?: string;
  message?: string;
  eventId?: string;
  speakerId?: string;
  timestamp: number;
  endTime?: number;
  error?: string;
}

export class CrossChainStateService extends BaseService {
  private transactions: CrossChainTransaction[] = [];
  private isInitialized: boolean = false;

  constructor() {
    super('CrossChainStateService');
  }

  /**
   * Initialize the service and register Redux actions
   */
  public async initialize(): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      if (this.isInitialized) {
        return true;
      }

      // Register slice with StateService
      this.registerCrossChainSlice();

      // Load initial state
      await this.loadTransactions();

      this.isInitialized = true;
      this.logInfo('CrossChainStateService initialized');
      return true;
    }, 'Failed to initialize CrossChainStateService');
  }

  /**
   * Register cross-chain slice with Redux
   */
  private registerCrossChainSlice(): void {
    StateService.registerSlice({
      name: 'crosschain',
      initialState: this.getInitialState(),
      reducers: {
        addTransaction: (state, action) => {
          state.transactions = [
            action.payload,
            ...state.transactions
          ];
        },
        updateTransaction: (state, action) => {
          state.transactions = state.transactions.map(tx =>
            tx.id === action.payload.id
              ? { ...tx, ...action.payload }
              : tx
          );
        },
        removeTransaction: (state, action) => {
          state.transactions = state.transactions.filter(tx => tx.id !== action.payload.id);
        },
        clearTransactions: (state) => {
          state.transactions = [];
        },
        resetState: (state) => {
          Object.assign(state, this.getInitialState());
        }
      },
      persist: true
    });

    this.logInfo('CrossChain slice registered');
  }

  /**
   * Selector functions for accessing state
   */
  public getSelectors() {
    return {
      // Get all cross-chain transactions
      getAllTransactions: (state) => {
        return state.crosschain?.transactions || [];
      },

      // Get pending transactions
      getPendingTransactions: (state) => {
        return (state.crosschain?.transactions || []).filter(
          tx => tx.status === CrossChainStatus.PENDING ||
               tx.status === CrossChainStatus.BRIDGING ||
               tx.status === CrossChainStatus.CONFIRMING
        );
      },

      // Get completed transactions
      getCompletedTransactions: (state) => {
        return (state.crosschain?.transactions || []).filter(
          tx => tx.status === CrossChainStatus.COMPLETED
        );
      },

      // Get failed transactions
      getFailedTransactions: (state) => {
        return (state.crosschain?.transactions || []).filter(
          tx => tx.status === CrossChainStatus.FAILED
        );
      },

      // Get transaction by ID
      getTransactionById: (state, id) => {
        return (state.crosschain?.transactions || []).find(tx => tx.id === id);
      },

      // Get transactions by chain
      getTransactionsByChain: (state, chainId) => {
        return (state.crosschain?.transactions || []).filter(
          tx => tx.sourceChain === chainId || tx.destinationChain === chainId
        );
      }
    };
  }

  /**
   * Get initial state for the reducer
   */
  private getInitialState() {
    return {
      transactions: []
    };
  }

  /**
   * Load transactions from storage
   */
  private async loadTransactions(): Promise<void> {
    // In a real implementation, we would load from localStorage or another persistent store
    // For now, we'll just initialize with an empty array
    this.transactions = [];
    
    // Dispatch to state
    StateService.dispatch({
      type: 'crosschain/clearTransactions'
    });

    this.logInfo('CrossChain transactions loaded');
  }

  /**
   * Get slice actions
   */
  private getActions() {
    const store = StateService.getStore();
    const state = store.getState() as any; // Type cast to any to avoid TypeScript errors
    
    // Only return actions if the slice has been registered
    const sliceActions = state.crosschain !== undefined ? {
      addTransaction: (payload) => ({ type: 'crosschain/addTransaction', payload }),
      updateTransaction: (payload) => ({ type: 'crosschain/updateTransaction', payload }),
      removeTransaction: (payload) => ({ type: 'crosschain/removeTransaction', payload }),
      clearTransactions: () => ({ type: 'crosschain/clearTransactions' }),
      resetState: () => ({ type: 'crosschain/resetState' })
    } : null;
    
    return sliceActions;
  }

  /**
   * Add a new cross-chain transaction to the state
   */
  public addTransaction(transaction: CrossChainTransaction): void {
    if (!ValidationService.isValidAddress(transaction.recipientAddress)) {
      this.logError('Invalid recipient address');
      return;
    }

    const actions = this.getActions();
    if (!actions) {
      this.logError('Slice actions not available. Has the service been initialized?');
      return;
    }

    StateService.dispatch(actions.addTransaction({
      ...transaction,
      timestamp: transaction.timestamp || Date.now()
    }));

    this.logInfo(`Transaction ${transaction.id} added to state`);
  }

  /**
   * Update an existing transaction in the state
   */
  public updateTransaction(
    id: string,
    updates: Partial<CrossChainTransaction>
  ): void {
    const actions = this.getActions();
    if (!actions) {
      this.logError('Slice actions not available. Has the service been initialized?');
      return;
    }

    StateService.dispatch(actions.updateTransaction({
      id,
      ...updates
    }));

    this.logInfo(`Transaction ${id} updated in state`);
  }

  /**
   * Remove a transaction from the state
   */
  public removeTransaction(id: string): void {
    const actions = this.getActions();
    if (!actions) {
      this.logError('Slice actions not available. Has the service been initialized?');
      return;
    }

    StateService.dispatch(actions.removeTransaction({ id }));

    this.logInfo(`Transaction ${id} removed from state`);
  }

  /**
   * Get all transactions from state
   */
  public getAllTransactions(): CrossChainTransaction[] {
    const state = StateService.getState();
    return this.getSelectors().getAllTransactions(state);
  }

  /**
   * Get pending transactions from state
   */
  public getPendingTransactions(): CrossChainTransaction[] {
    const state = StateService.getState();
    return this.getSelectors().getPendingTransactions(state);
  }

  /**
   * Get transaction by ID
   */
  public getTransactionById(id: string): CrossChainTransaction | undefined {
    const state = StateService.getState();
    return this.getSelectors().getTransactionById(state, id);
  }

  /**
   * Check status of pending transactions
   */
  public async checkPendingTransactions(): Promise<void> {
    try {
      const pendingTransactions = this.getPendingTransactions();
      
      for (const tx of pendingTransactions) {
        if (!tx.txHash) continue;
        
        // Get current status from CrossChainService
        const status = CrossChainService.getTransactionStatus(tx.id);
        
        if (status) {
          // Update transaction in state if status has changed
          if (status.status !== tx.status) {
            this.updateTransaction(tx.id, {
              status: status.status,
              endTime: status.endTime
            });
          }
        }
      }
    } catch (error) {
      this.logError('Failed to check pending transactions', error);
      ErrorHandlingService.handleError({
        service: 'CrossChainStateService',
        operation: 'checkPendingTransactions',
        error: error as Error,
        level: 'warning'
      });
    }
  }

  /**
   * Clear all transactions from state
   */
  public clearTransactions(): void {
    const actions = this.getActions();
    if (!actions) {
      this.logError('Slice actions not available. Has the service been initialized?');
      return;
    }

    StateService.dispatch(actions.clearTransactions());

    this.logInfo('All transactions cleared from state');
  }
}

// Export singleton instance
export default new CrossChainStateService();