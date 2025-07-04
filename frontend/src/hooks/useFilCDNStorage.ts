"use client";

import { useState, useCallback } from 'react';
import { useFilCDN } from '@/contexts/FilCDNContext';
import { StorageResult, RetrievalResult } from '@/services/filcdn/filcdnService';

interface UseFilCDNStorageOptions {
  enableAutoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface FileCDNStorageState {
  loading: boolean;
  error: string | null;
  lastCid: string | null;
}

/**
 * Hook for using FilCDN storage in components
 * Provides a simplified interface with loading state, error handling, and retry capability
 */
export function useFilCDNStorage(options: UseFilCDNStorageOptions = {}) {
  const {
    enableAutoRetry = true,
    maxRetries = 3,
    retryDelay = 2000
  } = options;

  const { filcdn, isInitialized } = useFilCDN();
  const [state, setState] = useState<FileCDNStorageState>({
    loading: false,
    error: null,
    lastCid: null
  });

  /**
   * Store data on FilCDN with retry capability
   */
  const storeData = useCallback(async <T>(data: T): Promise<StorageResult | null> => {
    if (!filcdn || !isInitialized) {
      setState(prev => ({ ...prev, error: 'FilCDN not initialized' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    let retries = 0;
    let result: StorageResult | null = null;

    while (retries <= maxRetries) {
      try {
        result = await filcdn.storeData(data);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: null,
          lastCid: result?.cid || null
        }));
        return result;
      } catch (err: any) {
        retries++;
        
        if (!enableAutoRetry || retries > maxRetries) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: `FilCDN storage error: ${err.message}`
          }));
          return null;
        }
        
        console.warn(`FilCDN storage attempt ${retries} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return null;
  }, [filcdn, isInitialized, enableAutoRetry, maxRetries, retryDelay]);

  /**
   * Retrieve data from FilCDN with retry capability
   */
  const retrieveData = useCallback(async <T>(cid: string): Promise<T | null> => {
    if (!filcdn || !isInitialized) {
      setState(prev => ({ ...prev, error: 'FilCDN not initialized' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    let retries = 0;

    while (retries <= maxRetries) {
      try {
        const result = await filcdn.retrieveData(cid);
        setState(prev => ({ ...prev, loading: false, error: null }));
        return result.data as T;
      } catch (err: any) {
        retries++;
        
        if (!enableAutoRetry || retries > maxRetries) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: `FilCDN retrieval error: ${err.message}`
          }));
          return null;
        }
        
        console.warn(`FilCDN retrieval attempt ${retries} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return null;
  }, [filcdn, isInitialized, enableAutoRetry, maxRetries, retryDelay]);

  /**
   * Get a CDN URL for direct access to stored content
   */
  const getCdnUrl = useCallback(async (cid: string): Promise<string | null> => {
    if (!filcdn || !isInitialized) {
      setState(prev => ({ ...prev, error: 'FilCDN not initialized' }));
      return null;
    }

    try {
      return await filcdn.getCDNUrl(cid);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: `Failed to get CDN URL: ${err.message}` }));
      return null;
    }
  }, [filcdn, isInitialized]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    storeData,
    retrieveData,
    getCdnUrl,
    clearError,
    loading: state.loading,
    error: state.error,
    lastCid: state.lastCid,
    isReady: filcdn !== null && isInitialized
  };
}