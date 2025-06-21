// Enhanced API service with comprehensive error handling and retry logic

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Types
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCount?: number;
  retryCondition?: (error: AxiosError) => boolean;
}

// API client configuration
const getApiBaseUrl = (): string => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Check for production environment
  if (import.meta.env.NODE_ENV === 'production' || import.meta.env.VITE_ENVIRONMENT === 'production') {
    return 'https://megavibe.onrender.com';
  }

  // Development fallback
  return 'http://localhost:3000';
};

// Create axios instance with enhanced configuration
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
  timeout: 30000, // 30 second timeout
  validateStatus: (status) => status < 500, // Don't throw for 4xx errors
});

// Request interceptor for auth and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic and error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & RetryConfig;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${config?.method?.toUpperCase()} ${config?.url}`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle specific error cases
    if (error.response?.status === 401) {
      handleUnauthorized();
      return Promise.reject(createApiError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (error.response?.status === 403) {
      return Promise.reject(createApiError('Access forbidden', 403, 'FORBIDDEN'));
    }

    if (error.response?.status === 404) {
      return Promise.reject(createApiError('Resource not found', 404, 'NOT_FOUND'));
    }

    // Retry logic for network errors and 5xx errors
    if (shouldRetry(error, config)) {
      return retryRequest(config);
    }

    // Create user-friendly error
    const apiError = createApiErrorFromAxiosError(error);
    return Promise.reject(apiError);
  }
);

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function handleUnauthorized(): void {
  localStorage.removeItem('auth_token');
  // Could dispatch a logout action or redirect to login
  if (window.location.pathname !== '/') {
    console.warn('User unauthorized, consider redirecting to login');
  }
}

function shouldRetry(error: AxiosError, config?: AxiosRequestConfig & RetryConfig): boolean {
  if (!config) return false;

  // Initialize retry config
  if (!config.retries) config.retries = 3;
  if (!config.retryDelay) config.retryDelay = 1000;
  if (config.retryCount === undefined) config.retryCount = 0;

  // Don't retry if we've exceeded max retries
  if (config.retryCount >= config.retries) return false;

  // Default retry condition
  const defaultRetryCondition = (err: AxiosError) => {
    return (
      !err.response || // Network error
      err.response.status >= 500 || // Server error
      err.code === 'ECONNABORTED' || // Timeout
      err.code === 'NETWORK_ERROR'
    );
  };

  const retryCondition = config.retryCondition || defaultRetryCondition;
  return retryCondition(error);
}

async function retryRequest(config: AxiosRequestConfig & RetryConfig): Promise<AxiosResponse> {
  config.retryCount = (config.retryCount || 0) + 1;

  // Exponential backoff
  const delay = config.retryDelay * Math.pow(2, config.retryCount - 1);

  console.log(`🔄 Retrying request (${config.retryCount}/${config.retries}) after ${delay}ms`);

  await new Promise(resolve => setTimeout(resolve, delay));
  return api(config);
}

function createApiError(message: string, status?: number, code?: string, details?: unknown): ApiError {
  return {
    message,
    status,
    code,
    details,
  };
}

function createApiErrorFromAxiosError(error: AxiosError): ApiError {
  if (error.response) {
    // Server responded with error status
    const data = error.response.data as Record<string, unknown>;
    return createApiError(
      (data?.message as string) || `Request failed with status ${error.response.status}`,
      error.response.status,
      (data?.code as string) || 'API_ERROR',
      data
    );
  } else if (error.request) {
    // Network error
    return createApiError(
      'Network error - please check your connection',
      0,
      'NETWORK_ERROR'
    );
  } else {
    // Request setup error
    return createApiError(
      error.message || 'Request failed',
      0,
      'REQUEST_ERROR'
    );
  }
}

// API endpoint functions with proper error handling
export const apiEndpoints = {
  // Health check
  health: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Tips
  tips: {
    create: async (tipData: {
      speakerId: string;
      eventId: string;
      amountUSD: number;
      message?: string;
    }) => {
      const response = await api.post('/api/tips/create', tipData);
      return response.data;
    },

    confirm: async (confirmData: {
      tipId: string;
      txHash: string;
      amountMNT?: number;
      blockNumber?: number;
      gasUsed?: number;
    }) => {
      const response = await api.post('/api/tips/confirm', confirmData);
      return response.data;
    },

    getEventTips: async (eventId: string, params?: {
      limit?: number;
      offset?: number;
      status?: string;
    }) => {
      const response = await api.get(`/api/tips/event/${eventId}`, { params });
      return response.data;
    },

    getLiveFeed: async (eventId: string, limit?: number) => {
      const response = await api.get(`/api/tips/event/${eventId}/live`, {
        params: { limit }
      });
      return response.data;
    },

    getSpeakerEarnings: async (speakerId: string, timeframe?: string) => {
      const response = await api.get(`/api/tips/speaker/${speakerId}/earnings`, {
        params: { timeframe }
      });
      return response.data;
    },

    acknowledge: async (tipId: string, response?: string) => {
      const result = await api.post(`/api/tips/${tipId}/acknowledge`, { response });
      return result.data;
    },
  },

  // Bounties
  bounties: {
    create: async (bountyData: {
      eventId: string;
      speakerId: string;
      title: string;
      description: string;
      reward: number;
      deadline: string;
      requirements?: string[];
      category?: string;
      deliverables?: string[];
    }) => {
      const response = await api.post('/api/bounties', bountyData);
      return response.data;
    },

    getAll: async (params?: {
      limit?: number;
      offset?: number;
      status?: string;
      category?: string;
      eventId?: string;
      speakerId?: string;
      minReward?: number;
      maxReward?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const response = await api.get('/api/bounties', { params });
      return response.data;
    },

    getById: async (bountyId: string) => {
      const response = await api.get(`/api/bounties/${bountyId}`);
      return response.data;
    },

    update: async (bountyId: string, updateData: {
      title?: string;
      description?: string;
      requirements?: string[];
      deliverables?: string[];
    }) => {
      const response = await api.put(`/api/bounties/${bountyId}`, updateData);
      return response.data;
    },

    delete: async (bountyId: string) => {
      const response = await api.delete(`/api/bounties/${bountyId}`);
      return response.data;
    },

    claim: async (bountyId: string) => {
      const response = await api.post(`/api/bounties/${bountyId}/claim`);
      return response.data;
    },

    submit: async (bountyId: string, submissionData: {
      submissionUrl: string;
      description: string;
      notes?: string;
    }) => {
      const response = await api.post(`/api/bounties/${bountyId}/submit`, submissionData);
      return response.data;
    },

    approve: async (bountyId: string, submissionId: string, feedback?: string, txHash?: string) => {
      const response = await api.post(`/api/bounties/${bountyId}/approve`, {
        submissionId,
        feedback,
        txHash
      });
      return response.data;
    },

    reject: async (bountyId: string, submissionId: string, feedback: string) => {
      const response = await api.post(`/api/bounties/${bountyId}/reject`, {
        submissionId,
        feedback
      });
      return response.data;
    },

    getEventBounties: async (eventId: string, status?: string, limit?: number) => {
      const response = await api.get(`/api/bounties/event/${eventId}`, {
        params: { status, limit }
      });
      return response.data;
    },

    getSpeakerBounties: async (speakerId: string, status?: string, limit?: number) => {
      const response = await api.get(`/api/bounties/speaker/${speakerId}`, {
        params: { status, limit }
      });
      return response.data;
    },
  },

  // Venues
  venues: {
    getNearby: async (lat: number, lng: number, radius?: number) => {
      const response = await api.get('/api/venues/nearby', {
        params: { lat, lng, radius }
      });
      return response.data;
    },

    search: async (query?: string, limit?: number) => {
      const response = await api.get('/api/venues/search', {
        params: { query, limit }
      });
      return response.data;
    },

    getById: async (venueId: string) => {
      const response = await api.get(`/api/venues/${venueId}`);
      return response.data;
    },

    getCurrentEvent: async (venueId: string) => {
      const response = await api.get(`/api/venues/${venueId}/event`);
      return response.data;
    },
  },

  // Events
  events: {
    getAll: async (params?: {
      limit?: number;
      offset?: number;
      status?: string;
      venueId?: string;
    }) => {
      const response = await api.get('/api/events', { params });
      return response.data;
    },

    getById: async (eventId: string) => {
      const response = await api.get(`/api/events/${eventId}`);
      return response.data;
    },
  },
};

// Legacy payment functions (keeping for backward compatibility)
export const initiatePayment = async (paymentData: Record<string, unknown>) => {
  try {
    const response = await api.post('/api/payments', paymentData);
    return response.data;
  } catch (_error) {
    throw createApiError('Payment initiation failed');
  }
};

export const confirmPayment = async (paymentId: unknown) => {
  try {
    const response = await api.post('/api/payments/confirm', { paymentId });
    return response.data;
  } catch (_error) {
    throw createApiError('Payment confirmation failed');
  }
};

// Export types
export type { ApiError };

// Export default api instance
export default api;
