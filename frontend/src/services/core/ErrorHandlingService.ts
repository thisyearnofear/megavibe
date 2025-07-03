/**
 * ErrorHandlingService.ts
 * 
 * Service for standardized error handling across the application,
 * including error logging, reporting, and user-friendly message generation.
 */

import { BaseService, ServiceResponse, ErrorCode, ServiceError } from './BaseService';
import ConfigService from './ConfigService';
import StateService from './StateService';

export interface ErrorReport {
  code: string;
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  appVersion?: string;
  environment?: string;
  url?: string;
}

export interface ErrorTranslation {
  code: string;
  userMessage: string;
  shouldReport: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  actionable: boolean;
  suggestedAction?: string;
}

class ErrorHandlingServiceClass extends BaseService {
  private errorTranslations: Record<string, ErrorTranslation> = {};
  private reportingEndpoint: string | null = null;
  private errorReportBuffer: ErrorReport[] = [];
  private readonly maxBufferSize: number = 10;
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private readonly localStorageKey: string = 'error_report_buffer';
  
  constructor() {
    super('ErrorHandlingService');
    
    // Initialize with default error translations
    this.initializeErrorTranslations();
  }
  
  /**
   * Initialize the error handling service
   */
  public async initialize(): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      // Load reporting configuration
      this.reportingEndpoint = ConfigService.get<string>('services.errorReporting.endpoint', null);
      
      // Set up error report flushing interval if reporting is enabled
      if (this.reportingEndpoint) {
        // Load any buffered reports from local storage
        await this.loadBufferedReports();
        
        // Set up interval to flush reports
        const flushIntervalMs = ConfigService.get<number>('services.errorReporting.flushInterval', 60000);
        this.flushInterval = setInterval(() => this.flushReports(), flushIntervalMs);
      }
      
      // Subscribe to global errors
      if (typeof window !== 'undefined') {
        window.addEventListener('error', this.handleGlobalError);
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
      }
      
      this.logInfo('ErrorHandlingService initialized');
      return true;
    }, 'Failed to initialize ErrorHandlingService');
  }
  
  /**
   * Handle and format an error
   */
  public handleError(error: any, context?: Record<string, any>): ServiceError {
    try {
      // If already a ServiceError, just return it
      if (error && error.code && error.message) {
        return error as ServiceError;
      }
      
      // Extract error code and message
      let code = ErrorCode.UNKNOWN_ERROR;
      let message = 'An unknown error occurred';
      
      if (error instanceof Error) {
        message = error.message;
        
        // Try to determine error code from message
        if (message.toLowerCase().includes('network')) {
          code = ErrorCode.NETWORK_ERROR;
        } else if (message.toLowerCase().includes('contract') || message.toLowerCase().includes('execution reverted')) {
          code = ErrorCode.CONTRACT_ERROR;
        } else if (message.toLowerCase().includes('wallet') || message.toLowerCase().includes('metamask')) {
          code = ErrorCode.WALLET_ERROR;
        } else if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('permission')) {
          code = ErrorCode.UNAUTHORIZED;
        } else if (message.toLowerCase().includes('validation')) {
          code = ErrorCode.VALIDATION_ERROR;
        } else if (message.toLowerCase().includes('rejected')) {
          code = ErrorCode.TRANSACTION_REJECTED;
        } else if (message.toLowerCase().includes('failed')) {
          code = ErrorCode.TRANSACTION_FAILED;
        } else if (message.toLowerCase().includes('not found')) {
          code = ErrorCode.NOT_FOUND;
        }
      } else if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error === 'object') {
        message = error.message || error.error || JSON.stringify(error);
        code = error.code || code;
      }
      
      // Report error if it's not a user rejection
      if (code !== ErrorCode.TRANSACTION_REJECTED) {
        this.reportError({
          code,
          message,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: Date.now(),
          context
        });
      }
      
      return {
        code,
        message,
        details: context,
        originalError: error
      };
    } catch (handlingError) {
      // Fallback if error handling itself fails
      this.logError('Error during error handling', handlingError);
      
      return {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'An error occurred while processing another error',
        originalError: error
      };
    }
  }
  
  /**
   * Get a user-friendly error message
   */
  public getUserFriendlyMessage(errorCode: string): string {
    const translation = this.errorTranslations[errorCode];
    
    if (translation) {
      return translation.userMessage;
    }
    
    // Default messages based on error code
    switch (errorCode) {
      case ErrorCode.NETWORK_ERROR:
        return 'Network connection issue. Please check your internet connection and try again.';
      
      case ErrorCode.CONTRACT_ERROR:
        return 'There was an issue with the blockchain transaction. Please try again later.';
      
      case ErrorCode.WALLET_ERROR:
        return 'There was an issue with your wallet. Please check your wallet connection and try again.';
      
      case ErrorCode.UNAUTHORIZED:
        return 'You are not authorized to perform this action. Please sign in and try again.';
      
      case ErrorCode.VALIDATION_ERROR:
        return 'Some of the information provided is not valid. Please check your inputs and try again.';
      
      case ErrorCode.TRANSACTION_REJECTED:
        return 'Transaction was rejected. No action needed if this was intentional.';
      
      case ErrorCode.TRANSACTION_FAILED:
        return 'Transaction failed. Please try again later.';
      
      case ErrorCode.NOT_FOUND:
        return 'The requested resource was not found.';
      
      default:
        return 'Something went wrong. Please try again later.';
    }
  }
  
  /**
   * Report an error to the reporting service
   */
  public reportError(errorReport: Partial<ErrorReport>): void {
    try {
      // Prepare complete error report
      const report: ErrorReport = {
        code: errorReport.code || ErrorCode.UNKNOWN_ERROR,
        message: errorReport.message || 'Unknown error',
        stack: errorReport.stack,
        timestamp: errorReport.timestamp || Date.now(),
        context: errorReport.context,
        // Add system information
        userId: (StateService.getState() as any).auth?.user?.id,
        sessionId: this.getSessionId(),
        appVersion: ConfigService.get<string>('version', '0.0.0'),
        environment: ConfigService.get<string>('environment', 'development'),
        url: typeof window !== 'undefined' ? window.location.href : undefined
      };
      
      // Check if we should report this error
      const translation = this.errorTranslations[report.code];
      if (translation && !translation.shouldReport) {
        this.logInfo(`Error ${report.code} not reported as per configuration`);
        return;
      }
      
      // Add to buffer
      this.errorReportBuffer.push(report);
      
      // Save buffer to local storage
      this.saveBufferedReports();
      
      // Flush if buffer is full
      if (this.errorReportBuffer.length >= this.maxBufferSize) {
        this.flushReports();
      }
    } catch (reportingError) {
      this.logError('Failed to report error', reportingError);
    }
  }
  
  /**
   * Flush error reports to the reporting service
   */
  public async flushReports(): Promise<void> {
    try {
      if (!this.reportingEndpoint || this.errorReportBuffer.length === 0) {
        return;
      }
      
      this.logInfo(`Flushing ${this.errorReportBuffer.length} error reports`);
      
      // In a real implementation, this would send reports to the reporting service
      // For now, we'll just log them
      // const response = await fetch(this.reportingEndpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(this.errorReportBuffer)
      // });
      
      // if (!response.ok) {
      //   throw new Error(`Failed to send error reports: ${response.status} ${response.statusText}`);
      // }
      
      // Clear buffer after successful reporting
      this.errorReportBuffer = [];
      
      // Clear local storage
      this.saveBufferedReports();
      
      this.logInfo('Error reports flushed successfully');
    } catch (flushError) {
      this.logError('Failed to flush error reports', flushError);
    }
  }
  
  /**
   * Handle global error event
   */
  private handleGlobalError = (event: ErrorEvent): void => {
    this.reportError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: event.message,
      stack: event.error?.stack,
      timestamp: Date.now(),
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  };
  
  /**
   * Handle unhandled promise rejection
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const error = event.reason;
    
    this.reportError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      context: {
        unhandledRejection: true
      }
    });
  };
  
  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }
    
    let sessionId = sessionStorage.getItem('session_id');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * Save buffered reports to local storage
   */
  private saveBufferedReports(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.errorReportBuffer));
      }
    } catch (storageError) {
      this.logWarning('Failed to save error reports to local storage', storageError);
    }
  }
  
  /**
   * Load buffered reports from local storage
   */
  private async loadBufferedReports(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedBuffer = localStorage.getItem(this.localStorageKey);
        
        if (savedBuffer) {
          this.errorReportBuffer = JSON.parse(savedBuffer);
          this.logInfo(`Loaded ${this.errorReportBuffer.length} buffered error reports`);
        }
      }
    } catch (storageError) {
      this.logWarning('Failed to load error reports from local storage', storageError);
    }
  }
  
  /**
   * Initialize error translations
   */
  private initializeErrorTranslations(): void {
    this.errorTranslations = {
      [ErrorCode.NETWORK_ERROR]: {
        code: ErrorCode.NETWORK_ERROR,
        userMessage: 'Network connection issue. Please check your internet connection and try again.',
        shouldReport: true,
        severity: 'medium',
        retryable: true,
        actionable: true,
        suggestedAction: 'Check your internet connection'
      },
      [ErrorCode.CONTRACT_ERROR]: {
        code: ErrorCode.CONTRACT_ERROR,
        userMessage: 'There was an issue with the blockchain transaction. Please try again later.',
        shouldReport: true,
        severity: 'high',
        retryable: true,
        actionable: false
      },
      [ErrorCode.WALLET_ERROR]: {
        code: ErrorCode.WALLET_ERROR,
        userMessage: 'There was an issue with your wallet. Please check your wallet connection and try again.',
        shouldReport: true,
        severity: 'medium',
        retryable: true,
        actionable: true,
        suggestedAction: 'Check your wallet connection'
      },
      [ErrorCode.UNAUTHORIZED]: {
        code: ErrorCode.UNAUTHORIZED,
        userMessage: 'You are not authorized to perform this action. Please sign in and try again.',
        shouldReport: false,
        severity: 'low',
        retryable: true,
        actionable: true,
        suggestedAction: 'Sign in'
      },
      [ErrorCode.VALIDATION_ERROR]: {
        code: ErrorCode.VALIDATION_ERROR,
        userMessage: 'Some of the information provided is not valid. Please check your inputs and try again.',
        shouldReport: false,
        severity: 'low',
        retryable: true,
        actionable: true,
        suggestedAction: 'Check form inputs'
      },
      [ErrorCode.TRANSACTION_REJECTED]: {
        code: ErrorCode.TRANSACTION_REJECTED,
        userMessage: 'Transaction was rejected. No action needed if this was intentional.',
        shouldReport: false,
        severity: 'low',
        retryable: true,
        actionable: false
      },
      [ErrorCode.TRANSACTION_FAILED]: {
        code: ErrorCode.TRANSACTION_FAILED,
        userMessage: 'Transaction failed. Please try again later.',
        shouldReport: true,
        severity: 'high',
        retryable: true,
        actionable: false
      },
      [ErrorCode.NOT_FOUND]: {
        code: ErrorCode.NOT_FOUND,
        userMessage: 'The requested resource was not found.',
        shouldReport: true,
        severity: 'medium',
        retryable: false,
        actionable: false
      },
      [ErrorCode.UNKNOWN_ERROR]: {
        code: ErrorCode.UNKNOWN_ERROR,
        userMessage: 'Something went wrong. Please try again later.',
        shouldReport: true,
        severity: 'high',
        retryable: true,
        actionable: false
      }
    };
  }
  
  /**
   * Clean up the service
   */
  public dispose(): void {
    // Clear interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush any remaining reports
    this.flushReports();
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }
}

// Export singleton instance
const ErrorHandlingService = new ErrorHandlingServiceClass();
export default ErrorHandlingService;