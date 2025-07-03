/**
 * APIService.ts
 * 
 * Service for handling API requests with standardized error handling,
 * request cancellation, response caching, and consistent formatting.
 * This service integrates with the existing api.ts infrastructure while
 * providing a more structured interface following the service pattern.
 */

import { BaseService, ServiceResponse, ErrorCode } from './BaseService';
import api, { ApiError as AxiosApiError } from '../api';
import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

// Cache configuration
interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
}

// Default cache settings
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttl: 5 * 60 * 1000 // 5 minutes
};

// Request configuration
export interface APIRequestConfig extends Omit<AxiosRequestConfig, 'cancelToken'> {
  cacheConfig?: CacheConfig;
  cancelToken?: any; // Using any here to avoid type conflicts with axios.CancelToken
  requestId?: string;
}

// Cache entry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

export enum APIErrorCode {
  REQUEST_FAILED = 'REQUEST_FAILED',
  REQUEST_CANCELLED = 'REQUEST_CANCELLED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export class APIService extends BaseService {
  private requestMap: Map<string, CancelTokenSource> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  constructor() {
    super('APIService');
  }

  /**
   * Generate a cache key for a request
   */
  private generateCacheKey(config: AxiosRequestConfig): string {
    const { method = 'GET', url = '', params, data } = config;
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
  }

  /**
   * Check if a cache entry is valid
   */
  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expires;
  }

  /**
   * Store data in the cache
   */
  private cacheResponse<T>(key: string, data: T, ttl: number): void {
    const timestamp = Date.now();
    const expires = timestamp + ttl;
    
    this.cache.set(key, {
      data,
      timestamp,
      expires
    });
    
    // Log cache operation in development
    if (import.meta.env.DEV) {
      this.logInfo(`Cached response for key ${key} (expires in ${ttl / 1000}s)`);
    }
  }

  /**
   * Create a cancel token for a request
   */
  private createCancelToken(requestId: string): CancelTokenSource {
    // Cancel existing request with the same ID if it exists
    this.cancelRequest(requestId);
    
    // Create new cancel token
    const source = axios.CancelToken.source();
    this.requestMap.set(requestId, source);
    return source;
  }

  /**
   * Cancel a specific request
   */
  public cancelRequest(requestId: string): boolean {
    const source = this.requestMap.get(requestId);
    if (source) {
      source.cancel(`Request ${requestId} cancelled`);
      this.requestMap.delete(requestId);
      this.logInfo(`Cancelled request ${requestId}`);
      return true;
    }
    return false;
  }

  /**
   * Cancel all pending requests
   */
  public cancelAllRequests(): void {
    this.requestMap.forEach((source, requestId) => {
      source.cancel(`Request ${requestId} cancelled due to cancelAllRequests()`);
      this.logInfo(`Cancelled request ${requestId}`);
    });
    this.requestMap.clear();
  }

  /**
   * Clear the entire cache or a specific cache entry
   */
  public clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
      this.logInfo(`Cleared cache for key ${cacheKey}`);
    } else {
      this.cache.clear();
      this.logInfo('Cleared entire request cache');
    }
  }

  /**
   * Execute a GET request
   */
  public async get<T>(
    url: string, 
    params?: Record<string, any>, 
    config?: APIRequestConfig
  ): Promise<ServiceResponse<T>> {
    const requestConfig: APIRequestConfig = {
      ...(config || {}),
      method: 'GET',
      url,
      params
    };
    
    return this.request<T>(requestConfig);
  }

  /**
   * Execute a POST request
   */
  public async post<T>(
    url: string, 
    data?: any, 
    config?: APIRequestConfig
  ): Promise<ServiceResponse<T>> {
    const requestConfig: APIRequestConfig = {
      ...(config || {}),
      method: 'POST',
      url,
      data
    };
    
    return this.request<T>(requestConfig);
  }

  /**
   * Execute a PUT request
   */
  public async put<T>(
    url: string, 
    data?: any, 
    config?: APIRequestConfig
  ): Promise<ServiceResponse<T>> {
    const requestConfig: APIRequestConfig = {
      ...(config || {}),
      method: 'PUT',
      url,
      data
    };
    
    return this.request<T>(requestConfig);
  }

  /**
   * Execute a DELETE request
   */
  public async delete<T>(
    url: string, 
    params?: Record<string, any>, 
    config?: APIRequestConfig
  ): Promise<ServiceResponse<T>> {
    const requestConfig: APIRequestConfig = {
      ...(config || {}),
      method: 'DELETE',
      url,
      params
    };
    
    return this.request<T>(requestConfig);
  }

  /**
   * Execute a PATCH request
   */
  public async patch<T>(
    url: string, 
    data?: any, 
    config?: APIRequestConfig
  ): Promise<ServiceResponse<T>> {
    const requestConfig: APIRequestConfig = {
      ...(config || {}),
      method: 'PATCH',
      url,
      data
    };
    
    return this.request<T>(requestConfig);
  }

  /**
   * Execute a request with the given configuration
   */
  public async request<T>(config: APIRequestConfig): Promise<ServiceResponse<T>> {
    return this.executeOperation<T>(async () => {
      // Apply default cache config if not provided
      const cacheConfig = config.cacheConfig || 
        (config.method?.toUpperCase() === 'GET' ? DEFAULT_CACHE_CONFIG : { enabled: false, ttl: 0 });
      
      // Generate cache key
      // Create a new config object that axios can accept
      const axiosConfig: AxiosRequestConfig = {
        ...config
      };
      
      const cacheKey = this.generateCacheKey(axiosConfig);
      
      // Check cache for GET requests
      if (cacheConfig.enabled && config.method?.toUpperCase() === 'GET') {
        const cachedData = this.cache.get(cacheKey);
        
        if (cachedData && this.isCacheValid(cachedData)) {
          this.logInfo(`Using cached response for ${config.url}`);
          return cachedData.data as T;
        }
      }

      // Set up cancel token if requestId is provided
      const requestId = config.headers?.['X-Request-ID'] as string || `req_${Date.now()}`;
      if (!config.cancelToken && !config.signal) {
        const source = this.createCancelToken(requestId);
        config.cancelToken = source.token;
      }
      
      try {
        // Execute request
        const response = await api.request<T>(axiosConfig);
        
        // Cache successful GET responses
        if (cacheConfig.enabled && config.method?.toUpperCase() === 'GET') {
          this.cacheResponse(cacheKey, response.data as T, cacheConfig.ttl);
        }
        
        // Clean up cancel token
        if (requestId) {
          this.requestMap.delete(requestId);
        }
        
        return response.data;
      } catch (error) {
        // Map Axios errors to our service error format
        this.mapAxiosError(error as AxiosError | Error);
        throw error;
      }
    }, `API request to ${config.url} failed`);
  }

  /**
   * Map Axios errors to service error format
   */
  private mapAxiosError(error: AxiosError | Error): void {
    if (axios.isCancel(error)) {
      throw {
        code: APIErrorCode.REQUEST_CANCELLED,
        message: 'Request was cancelled',
        details: error.message
      };
    }
    
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      // Server responded with error status
      const status = axiosError.response.status;
      const data = axiosError.response.data as Record<string, any>;
      
      let errorCode: string;
      let errorMessage: string;
      
      switch (status) {
        case 400:
          errorCode = APIErrorCode.VALIDATION_ERROR;
          errorMessage = data.message || 'Invalid request parameters';
          break;
          
        case 401:
          errorCode = APIErrorCode.UNAUTHORIZED;
          errorMessage = 'Authentication required';
          break;
          
        case 403:
          errorCode = APIErrorCode.FORBIDDEN;
          errorMessage = 'Access forbidden';
          break;
          
        case 404:
          errorCode = APIErrorCode.NOT_FOUND;
          errorMessage = 'Resource not found';
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          errorCode = APIErrorCode.SERVER_ERROR;
          errorMessage = 'Server error occurred';
          break;
          
        default:
          errorCode = APIErrorCode.REQUEST_FAILED;
          errorMessage = `Request failed with status ${status}`;
      }
      
      throw {
        code: errorCode,
        message: errorMessage,
        details: data
      };
    } else if (axiosError.request) {
      // Request was made but no response received
      if (axiosError.code === 'ECONNABORTED') {
        throw {
          code: APIErrorCode.TIMEOUT,
          message: 'Request timed out',
          details: axiosError.message || String(error)
        };
      } else {
        throw {
          code: APIErrorCode.NETWORK_ERROR,
          message: 'Network error - please check your connection',
          details: axiosError.message || String(error)
        };
      }
    } else {
      // Request setup error
      const err = error as Error;
      throw {
        code: APIErrorCode.REQUEST_FAILED,
        message: err.message || 'Request failed',
        details: err
      };
    }
  }

  /**
   * Create AbortController for fetch API support
   */
  public createAbortController(requestId: string): AbortController {
    const controller = new AbortController();
    const source = axios.CancelToken.source();
    
    // Store the cancel token so we can cancel via cancelRequest
    this.requestMap.set(requestId, source);
    
    // When abort is called, also cancel the axios request
    const originalAbort = controller.abort;
    controller.abort = () => {
      originalAbort.call(controller);
      source.cancel(`Request ${requestId} aborted`);
      this.requestMap.delete(requestId);
    };
    
    return controller;
  }

  /**
   * Upload a file with progress tracking
   */
  public async uploadFile<T>(
    url: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void,
    requestId?: string
  ): Promise<ServiceResponse<T>> {
    return this.executeOperation(async () => {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Add additional data if provided
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      
      // Set up cancel token
      const id = requestId || `upload_${Date.now()}`;
      const source = this.createCancelToken(id);
      
      // Set up config with progress tracking
      const config: AxiosRequestConfig = {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        cancelToken: source.token
      };
      
      // Execute request
      const response = await api.post<T>(url, formData, config);
      
      // Clean up cancel token
      this.requestMap.delete(id);
      
      return response.data;
    }, `File upload to ${url} failed`);
  }

  /**
   * Download a file with progress tracking
   */
  public async downloadFile(
    url: string,
    filename?: string,
    onProgress?: (progress: number) => void,
    requestId?: string
  ): Promise<ServiceResponse<Blob>> {
    return this.executeOperation(async () => {
      // Set up cancel token
      const id = requestId || `download_${Date.now()}`;
      const source = this.createCancelToken(id);
      
      // Set up config
      const config: AxiosRequestConfig = {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
        cancelToken: source.token
      };
      
      // Execute request
      const response = await api.get<Blob>(url, config);
      
      // Clean up cancel token
      this.requestMap.delete(id);
      
      // Trigger download if filename is provided
      if (filename) {
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }
      
      return response.data;
    }, `File download from ${url} failed`);
  }

  /**
   * Create a reusable API endpoint
   */
  public createEndpoint<TParams extends any[], TResult>(
    method: string,
    url: string,
    requestBuilder: (...params: TParams) => { path?: Record<string, string>, query?: Record<string, any>, body?: any }
  ) {
    return async (...params: TParams): Promise<ServiceResponse<TResult>> => {
      const { path, query, body } = requestBuilder(...params);
      
      // Replace path parameters in URL
      let resolvedUrl = url;
      if (path) {
        Object.entries(path).forEach(([key, value]) => {
          resolvedUrl = resolvedUrl.replace(`:${key}`, encodeURIComponent(value));
        });
      }
      
      // Execute request based on method
      switch (method.toUpperCase()) {
        case 'GET':
          return this.get<TResult>(resolvedUrl, query);
          
        case 'POST':
          return this.post<TResult>(resolvedUrl, body);
          
        case 'PUT':
          return this.put<TResult>(resolvedUrl, body);
          
        case 'DELETE':
          return this.delete<TResult>(resolvedUrl, query);
          
        case 'PATCH':
          return this.patch<TResult>(resolvedUrl, body);
          
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    };
  }
}

// Export singleton instance
export default new APIService();