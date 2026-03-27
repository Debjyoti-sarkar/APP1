/**
 * API Configuration
 * Configure backend URLs based on platform and environment
 * 
 * For physical Android devices:
 * 1. Find your machine IP: ipconfig (Windows) or ifconfig (Mac/Linux)
 * 2. Update PHYSICAL_DEVICE_IP below with your machine IP (e.g., 192.168.x.x)
 * 3. Make sure both devices are on the same WiFi network
 */

import { Platform } from 'react-native';

// ==================== CONFIGURATION ====================
// Update this with your machine's local IP for physical device testing
// Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
// Example: '192.168.1.100' (not localhost or 10.0.2.2)
const PHYSICAL_DEVICE_IP = '172.16.7.167'; // ← YOUR MACHINE IP (Ethernet)
const BACKEND_PORT = 3001; // Voice server port (NOT 5000)

// =========================================================

/**
 * Determine if running on Android emulator vs physical device
 * Emulator has special IP 10.0.2.2 that works only in emulator
 */
const isAndroidEmulator = (): boolean => {
  if (Platform.OS !== 'android') return false;
  
  // In emulator, system property ro.kernel.qemu is set
  // We'll assume it's emulator and let user override if needed
  return true; // Default to emulator for Android
};

/**
 * Get the appropriate API base URL based on platform and environment
 */
export const getApiBaseUrl = (): string => {
  if (__DEV__) {
    switch (Platform.OS) {
      case 'android':
        // Try emulator first, user can override PHYSICAL_DEVICE_IP if on real device
        // For physical devices, use PHYSICAL_DEVICE_IP (172.16.7.167)
        return `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}`;
        
      case 'ios':
        // iOS simulator and devices
        return `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}`;
        
      case 'web':
        // Web platform uses localhost
        return `http://localhost:${BACKEND_PORT}`;
        
      default:
        return `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}`;
    }
  } else {
    // Production environment
    return 'https://your-production-api.com';
  }
};

/**
 * Get physical device IP configuration
 * Use this if 10.0.2.2 doesn't work (real Android device)
 */
export const getPhysicalDeviceUrl = (): string => {
  if (PHYSICAL_DEVICE_IP === '192.168.1.100') {
    console.warn('⚠️  PHYSICAL_DEVICE_IP not configured. Update config/apiConfig.ts with your machine IP');
    return `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}`;
  }
  return `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}`;
};

/**
 * Axios configuration for network requests
 */
export const axiosConfig = {
  timeout: 15000, // 15 seconds timeout
  validateStatus: (status: number) => status < 500, // Don't throw on 4xx
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Retry configuration for failed requests
 */
export const retryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Helper to detect network type (for debugging)
 */
export const getNetworkInfo = () => {
  return {
    platform: Platform.OS,
    isDev: __DEV__,
    isAndroid: Platform.OS === 'android',
    isIOS: Platform.OS === 'ios',
    isWeb: Platform.OS === 'web',
    apiUrl: getApiBaseUrl(),
    physicalDeviceUrl: getPhysicalDeviceUrl(),
  };
};
