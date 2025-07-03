/**
 * BaseService.ts
 * 
 * Core service class that provides common functionality for all services
 * including error handling, logging, and standard response formatting.
 */

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  originalError?: any;
}

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class BaseService {
  protected serviceName: string;
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Create a successful response object
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Create an error response object
   */
  protected error<T>(error: ServiceError): ServiceResponse<T> {
    console.error(`[${this.serviceName}] Error:`, error);
    
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      timestamp: Date.now()
    };
  }

  /**
   * Handle errors from API calls, contract interactions, etc.
   */
  protected handleError(err: any): ServiceError {
    // Handle different error types (API errors, contract errors, etc.)
    if (err.code && err.message) {
      // Already formatted error
      return err as ServiceError;
    }

    // Handle wallet/provider errors (MetaMask, etc.)
    if (err.code === 4001) {
      return {
        code: ErrorCode.TRANSACTION_REJECTED,
        message: 'Transaction rejected by user',
        originalError: err
      };
    }

    // Handle network errors
    if (err.message && err.message.includes('network')) {
      return {
        code: ErrorCode.NETWORK_ERROR,
        message: 'Network error, please check your connection',
        originalError: err
      };
    }

    // Handle contract errors
    if (err.message && (
      err.message.includes('contract') || 
      err.message.includes('execution reverted')
    )) {
      return {
        code: ErrorCode.CONTRACT_ERROR,
        message: 'Smart contract error',
        details: this.extractContractErrorDetails(err),
        originalError: err
      };
    }

    // Default unknown error
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: err.message || 'An unknown error occurred',
      originalError: err
    };
  }

  /**
   * Extract meaningful details from contract errors
   */
  private extractContractErrorDetails(err: any): string {
    if (!err) return 'No details available';
    
    // Try to extract revert reason
    const revertReasonMatch = err.message?.match(/reverted with reason string '([^']+)'/);
    if (revertReasonMatch && revertReasonMatch[1]) {
      return revertReasonMatch[1];
    }
    
    // Try to extract error data
    if (err.data) {
      return `Error data: ${err.data}`;
    }
    
    return err.message || 'No details available';
  }

  /**
   * Log an informational message
   */
  protected logInfo(message: string, ...args: any[]): void {
    console.info(`[${this.serviceName}] ${message}`, ...args);
  }

  /**
   * Log a warning message
   */
  protected logWarning(message: string, ...args: any[]): void {
    console.warn(`[${this.serviceName}] ${message}`, ...args);
  }

  /**
   * Log an error message
   */
  protected logError(message: string, ...args: any[]): void {
    console.error(`[${this.serviceName}] ${message}`, ...args);
  }
  
  /**
   * Execute an async operation with proper error handling
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>, 
    errorMessage: string = 'Operation failed'
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await operation();
      return this.success(result);
    } catch (err) {
      const formattedError = this.handleError(err);
      formattedError.message = `${errorMessage}: ${formattedError.message}`;
      return this.error(formattedError);
    }
  }
}