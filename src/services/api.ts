// api.ts

import axios from 'axios';

// API client for making requests to backend
export const api = axios.create({
  baseURL: 'http://localhost:3000/api' 
});

// Payment functions that call backend API routes

export const initiatePayment = async (paymentData: any) => {
  try {
    const response = await api.post('/payments', paymentData);
    return response.data;
  } catch (error) {
    throw new Error('Payment initiation failed'); 
  }
}

export const confirmPayment = async (paymentId: any) => {
  try {
    const response = await api.post('/payments/confirm', { paymentId });
    return response.data; 
  } catch (error) {
    throw new Error('Payment confirmation failed');
  }
}