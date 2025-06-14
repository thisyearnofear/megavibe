// api.ts - Enhanced API service with all endpoints

import axios from 'axios';

// API client for making requests to backend
export const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? 'https://megavibe.vercel.app' : 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For session cookies
});

// Request interceptor for auth
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling with retry logic
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Redirect to login if needed
    }
    // Retry logic for network errors or server errors
    const config = error.config;
    if (!config || !config.retry) {
      config.retry = 3; // Set max retries
      config.retryCount = 0; // Initialize retry count
    }
    if (config.retryCount < config.retry && (!error.response || error.response.status >= 500)) {
      config.retryCount += 1;
      // Exponential backoff
      const delay = Math.pow(2, config.retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }
    return Promise.reject(error);
  }
);

// Payment functions
export const initiatePayment = async (paymentData: any) => {
  try {
    const response = await api.post('/payments', paymentData);
    return response.data;
  } catch (error) {
    throw new Error('Payment initiation failed');
  }
};

export const confirmPayment = async (paymentId: any) => {
  try {
    const response = await api.post('/payments/confirm', { paymentId });
    return response.data;
  } catch (error) {
    throw new Error('Payment confirmation failed');
  }
};
