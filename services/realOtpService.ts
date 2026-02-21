/**
 * Real OTP Service - Frontend
 * Handles real OTP sending and verification using backend Fast2SMS integration
 * With retry logic and improved error handling for network issues
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApiBaseUrl, axiosConfig, retryConfig, getNetworkInfo } from '@/config/apiConfig';

// Create axios instance with custom config
const axiosInstance: AxiosInstance = axios.create(axiosConfig);

// Helper function to format phone number correctly
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's 10 digits (Indian number), add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it's already 12 digits (with country code), add +
  if (cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  // If it starts with country code but no +, add +
  if (cleaned.length > 10 && !phone.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  // Return as is if already formatted
  return phone.startsWith('+') ? phone : `+91${cleaned}`;
};

export interface OTPResponse {
  success: boolean;
  status?: string;
  to?: string;
  message: string;
  error?: string;
  valid?: boolean;
}

class RealOTPService {
  private baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = getApiBaseUrl()) {
    this.baseURL = baseURL;
    this.axiosInstance = axiosInstance;
  }

  /**
   * Retry logic for failed requests
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries: number = retryConfig.maxRetries
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        const status = error.response?.status;
        const isRetryable = 
          error.code === 'ECONNABORTED' || // timeout
          error.code === 'ECONNREFUSED' || // connection refused
          error.code === 'ETIMEDOUT' ||    // timeout
          error.message.includes('Network Error') ||
          (status && retryConfig.retryableStatusCodes.includes(status));

        if (!isRetryable) {
          throw error;
        }

        if (attempt < retries) {
          const delay = retryConfig.retryDelay * attempt;
          console.log(`🔄 Retry attempt ${attempt}/${retries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Send OTP to a phone number with retry logic
   * @param phoneNumber - Phone number with or without country code
   * @returns Promise with OTP sending result
   */
  async sendOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      // Log network info for debugging
      const networkInfo = getNetworkInfo();
      console.log(`📊 Network Info:`, networkInfo);
      console.log(`📡 Using API endpoint: ${this.baseURL}`);
      console.log(`📱 Platform: ${Platform.OS}`);
      console.log(`📱 Sending real SMS OTP to: ${phoneNumber}`);
      
      // Format phone number properly
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Use retry logic for the actual request
      const response = await this.retryRequest(async () => {
        return await this.axiosInstance.post(`${this.baseURL}/otp/send`, {
          phoneNumber: formattedPhone,
        });
      });

      // Store phone number for verification
      await AsyncStorage.setItem('otp_phone_number', formattedPhone);
      await AsyncStorage.setItem('otp_sent_time', Date.now().toString());

      console.log('✅ OTP sent successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error.message);
      console.error('📡 API Endpoint attempted:', this.baseURL);
      console.error('🔍 Error details:', {
        code: error.code,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      
      if (error.response) {
        return error.response.data;
      }
      
      // Network error details
      return {
        success: false,
        message: this.getNetworkErrorMessage(error),
        error: error.message,
      };
    }
  }

  /**
   * Get user-friendly error message based on error type
   */
  private getNetworkErrorMessage(error: any): string {
    const code = error.code;
    const message = error.message;

    if (code === 'ECONNREFUSED') {
      return '❌ Backend server not running. Make sure backend is started on port 5000. (ECONNREFUSED)';
    }
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return '⏱️ Request timeout. Backend server may be slow or unreachable. Check network connection.';
    }
    if (message.includes('Network Error')) {
      return '📡 Network error. Ensure backend is running and your device can reach it. Check IP configuration in config/apiConfig.ts';
    }
    if (message.includes('getaddrinfo ENOTFOUND')) {
      return '🔍 Cannot resolve hostname. Check API endpoint configuration.';
    }
    
    return `❌ Network error: ${message}`;
  }

  /**
   * Verify OTP code with retry logic
   * @param phoneNumber - Phone number
   * @param code - OTP code entered by user
   * @returns Promise with verification result
   */
  async verifyOTP(phoneNumber: string, code: string): Promise<OTPResponse> {
    try {
      console.log(`🔍 Verifying OTP for: ${phoneNumber}`);
      console.log(`📡 Using API endpoint: ${this.baseURL}`);
      
      // Format phone number
      let formattedPhone = phoneNumber.trim();
      
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
      }

      // Use retry logic for the actual request
      const response = await this.retryRequest(async () => {
        return await this.axiosInstance.post(`${this.baseURL}/otp/verify`, {
          phoneNumber: formattedPhone,
          code: code.trim(),
        });
      });

      // Clear stored data if verification successful
      if (response.data.success) {
        console.log('✅ OTP verification successful');
        await AsyncStorage.removeItem('otp_phone_number');
        await AsyncStorage.removeItem('otp_sent_time');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error.message);
      console.error('📡 API Endpoint attempted:', this.baseURL);
      console.error('🔍 Error details:', {
        code: error.code,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      
      if (error.response) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: this.getNetworkErrorMessage(error),
        error: error.message,
      };
    }
  }

  /**
   * Resend OTP to the same phone number
   * @param phoneNumber - Phone number
   * @returns Promise with OTP sending result
   */
  async resendOTP(phoneNumber: string): Promise<OTPResponse> {
    return this.sendOTP(phoneNumber);
  }

  /**
   * Get the phone number that OTP was sent to
   * @returns Stored phone number or null
   */
  async getStoredPhoneNumber(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('otp_phone_number');
    } catch (error) {
      console.error('Error getting stored phone number:', error);
      return null;
    }
  }

  /**
   * Get time since OTP was sent (in seconds)
   * @returns Time in seconds or null
   */
  async getTimeSinceOTPSent(): Promise<number | null> {
    try {
      const sentTime = await AsyncStorage.getItem('otp_sent_time');
      if (!sentTime) return null;
      
      const elapsed = Date.now() - parseInt(sentTime);
      return Math.floor(elapsed / 1000);
    } catch (error) {
      console.error('Error getting OTP sent time:', error);
      return null;
    }
  }

  /**
   * Clear stored OTP data
   */
  async clearOTPData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('otp_phone_number');
      await AsyncStorage.removeItem('otp_sent_time');
    } catch (error) {
      console.error('Error clearing OTP data:', error);
    }
  }
}

// Export singleton instance
export const realOTPService = new RealOTPService();

// Export class for custom instances
export default RealOTPService;
