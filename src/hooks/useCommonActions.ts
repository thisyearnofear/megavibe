import React, { useState, useCallback } from 'react';

interface UseCommonActionsReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  handleAction: (action: () => Promise<void>) => Promise<void>;
  handleActionWithResult: <T>(action: () => Promise<T>) => Promise<T | null>;
  clearError: () => void;
  clearSuccess: () => void;
  reset: () => void;
}

/**
 * Common hook for handling async actions with loading, error, and success states
 * Eliminates duplication across components that need similar action handling
 */
export const useCommonActions = (): UseCommonActionsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAction = useCallback(async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await action();
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Action failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleActionWithResult = useCallback(async <T>(action: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await action();
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Action failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    handleAction,
    handleActionWithResult,
    clearError,
    clearSuccess,
    reset
  };
};

/**
 * Hook for handling form submissions with common patterns
 */
export const useFormSubmission = <T extends Record<string, any>>(
  submitFn: (data: T) => Promise<void>,
  options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    resetOnSuccess?: boolean;
  }
) => {
  const { loading, error, success, handleAction, reset } = useCommonActions();

  const handleSubmit = useCallback(async (data: T) => {
    await handleAction(async () => {
      await submitFn(data);
      if (options?.onSuccess) {
        options.onSuccess();
      }
      if (options?.resetOnSuccess) {
        // Reset form would be handled by the component
      }
    });
  }, [handleAction, submitFn, options]);

  return {
    loading,
    error,
    success,
    handleSubmit,
    reset
  };
};

/**
 * Hook for handling data fetching with common patterns
 */
export const useDataFetching = <T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const { loading, error, handleActionWithResult } = useCommonActions();

  const fetchData = useCallback(async () => {
    const result = await handleActionWithResult(fetchFn);
    if (result !== null) {
      setData(result);
    }
  }, [handleActionWithResult, fetchFn]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Auto-fetch on mount and dependency changes
  React.useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch
  };
};