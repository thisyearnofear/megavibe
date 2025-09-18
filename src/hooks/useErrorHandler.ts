// Unified Error Handling System
// ENHANCEMENT FIRST: Enhances existing error handling patterns with consistent UX
// AGGRESSIVE CONSOLIDATION: Replaces scattered error handling across components
// CLEAN: Clear separation of error types and recovery strategies

'use client';

import { useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  INTEGRATION = 'integration',
  USER_ACTION = 'user_action',
  SYSTEM = 'system',
}

export interface ErrorContext {
  category: ErrorCategory;
  severity: ErrorSeverity;
  operation: string;
  userMessage: string;
  technicalMessage: string;
  recoveryActions?: Array<{
    label: string;
    action: () => void | Promise<void>;
  }>;
  metadata?: Record<string, unknown>;
}

export interface ErrorHandlerOptions {
  silent?: boolean;
  showToast?: boolean;
  showModal?: boolean;
  logToConsole?: boolean;
  reportToService?: boolean;
}

/**
 * Unified error handling hook that provides consistent error management
 * MODULAR: Composable error handling that can be used across all components
 * PERFORMANT: Optimized error reporting and user feedback
 */
export function useErrorHandler() {
  const { showNotification } = useUIStore();

  const handleError = useCallback((
    error: Error | string | unknown,
    context: Partial<ErrorContext> = {},
    options: ErrorHandlerOptions = {}
  ) => {
    const defaultOptions: ErrorHandlerOptions = {
      silent: false,
      showToast: true,
      showModal: false,
      logToConsole: true,
      reportToService: false,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Normalize error to ErrorContext
    const errorContext = normalizeError(error, context);

    // Log to console if enabled
    if (mergedOptions.logToConsole) {
      logError(errorContext);
    }

    // Show user notification if not silent
    if (!mergedOptions.silent && mergedOptions.showToast) {
      showUserNotification(errorContext);
    }

    // Report to error service if enabled
    if (mergedOptions.reportToService) {
      reportError(errorContext);
    }

    return errorContext;
  }, [showNotification]);

  // Specific error handlers for common scenarios
  const handleNetworkError = useCallback((error: unknown, operation: string) => {
    return handleError(error, {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      operation,
      userMessage: 'Network connection issue. Please check your internet connection.',
      recoveryActions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
        },
      ],
    });
  }, [handleError]);

  const handleWalletError = useCallback((error: unknown, operation: string) => {
    const isUserRejection = error instanceof Error && 
      (error.message.includes('user rejected') || error.message.includes('User denied'));

    return handleError(error, {
      category: ErrorCategory.AUTHENTICATION,
      severity: isUserRejection ? ErrorSeverity.LOW : ErrorSeverity.HIGH,
      operation,
      userMessage: isUserRejection 
        ? 'Transaction was cancelled by user'
        : 'Wallet connection failed. Please try connecting again.',
    });
  }, [handleError]);

  const handleFilCDNError = useCallback((error: unknown, operation: string) => {
    return handleError(error, {
      category: ErrorCategory.INTEGRATION,
      severity: ErrorSeverity.MEDIUM,
      operation,
      userMessage: 'Storage system error. Your data may not be saved.',
      recoveryActions: [
        {
          label: 'Try Local Storage',
          action: () => console.log('Fallback to local storage'),
        },
      ],
    });
  }, [handleError]);

  const handleValidationError = useCallback((error: unknown, field: string) => {
    return handleError(error, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      operation: `validate_${field}`,
      userMessage: 'Please check your input and try again.',
    }, {
      showToast: false, // Validation errors are usually shown inline
    });
  }, [handleError]);

  const handlePermissionError = useCallback((error: unknown, permission: string) => {
    return handleError(error, {
      category: ErrorCategory.PERMISSION,
      severity: ErrorSeverity.MEDIUM,
      operation: `permission_${permission}`,
      userMessage: `Permission denied for ${permission}. Please grant access to continue.`,
    });
  }, [handleError]);

  // Helper function to normalize different error types
  const normalizeError = (
    error: Error | string | unknown,
    context: Partial<ErrorContext>
  ): ErrorContext => {
    let technicalMessage = 'Unknown error';
    let userMessage = 'An unexpected error occurred';

    if (error instanceof Error) {
      technicalMessage = error.message;
      // Try to extract user-friendly message from common error patterns
      if (error.message.includes('network')) {
        userMessage = 'Network connection issue';
      } else if (error.message.includes('permission') || error.message.includes('denied')) {
        userMessage = 'Permission denied';
      } else if (error.message.includes('not found')) {
        userMessage = 'Resource not found';
      }
    } else if (typeof error === 'string') {
      technicalMessage = error;
      userMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      technicalMessage = String((error as { message: unknown }).message);
    }

    return {
      category: context.category || ErrorCategory.SYSTEM,
      severity: context.severity || ErrorSeverity.MEDIUM,
      operation: context.operation || 'unknown_operation',
      userMessage: context.userMessage || userMessage,
      technicalMessage,
      recoveryActions: context.recoveryActions,
      metadata: {
        timestamp: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        ...context.metadata,
      },
    };
  };

  const logError = (errorContext: ErrorContext) => {
    const logLevel = {
      [ErrorSeverity.LOW]: 'info' as const,
      [ErrorSeverity.MEDIUM]: 'warn' as const,
      [ErrorSeverity.HIGH]: 'error' as const,
      [ErrorSeverity.CRITICAL]: 'error' as const,
    }[errorContext.severity];

    (console[logLevel] as typeof console.log)(`[${errorContext.category.toUpperCase()}] ${errorContext.operation}:`, {
      message: errorContext.technicalMessage,
      userMessage: errorContext.userMessage,
      metadata: errorContext.metadata,
    });
  };

  const showUserNotification = (errorContext: ErrorContext) => {
    const notificationType = {
      [ErrorSeverity.LOW]: 'info',
      [ErrorSeverity.MEDIUM]: 'warning',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'error',
    }[errorContext.severity] as 'info' | 'warning' | 'error';

    showNotification({
      type: notificationType,
      title: `${errorContext.category.replace('_', ' ').toUpperCase()} Error`,
      message: errorContext.userMessage,
      action: errorContext.recoveryActions?.[0] ? {
        label: errorContext.recoveryActions[0].label,
        callback: errorContext.recoveryActions[0].action,
      } : undefined,
    });
  };

  const reportError = (errorContext: ErrorContext) => {
    // This would integrate with an error reporting service like Sentry
    console.log('Reporting error to service:', errorContext);
  };

  return {
    handleError,
    handleNetworkError,
    handleWalletError,
    handleFilCDNError,
    handleValidationError,
    handlePermissionError,
  };
}