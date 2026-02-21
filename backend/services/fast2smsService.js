/**
 * Fast2SMS OTP Service
 * Handles real OTP sending via Fast2SMS Bulk SMS API
 * Production-only real SMS sending - no test/bypass mode
 */

const axios = require('axios');

// Fast2SMS Configuration
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Send OTP via Fast2SMS
 * @param {string} phoneNumber - Phone number (10 digits or with country code)
 * @returns {Promise<Object>} - OTP sending result
 */
async function sendOTP(phoneNumber) {
  let cleanPhone;
  let otp;
  
  try {
    if (!FAST2SMS_API_KEY) {
      throw new Error('Fast2SMS API key not configured');
    }

    // Validate and format phone number
    cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // If it's 10 digits, add country code
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      // Already has country code
    } else if (cleanPhone.length !== 12) {
      throw new Error('Invalid phone number. Must be 10 digits (Indian) or include country code');
    }

    // Generate random 6-digit OTP
    otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`📤 Sending OTP to +${cleanPhone}: ${otp}`);

    // Send via Fast2SMS Bulk SMS API (route 'q' doesn't require verification)
    const response = await axios.post(
      FAST2SMS_BASE_URL,
      {
        route: 'q',  // Using bulk SMS route instead of OTP
        message: `Your KAVACH verification code is ${otp}. Valid for 5 minutes.`,
        numbers: cleanPhone,
      },
      {
        headers: {
          authorization: FAST2SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('✅ Fast2SMS Response:', response.data);

    // Fast2SMS returns success if return code is 200
    if (response.data.return && response.data.return === true) {
      console.log('✅ OTP sent successfully via Fast2SMS');
      return {
        success: true,
        status: 'sent',
        to: `+${cleanPhone}`,
        message: 'OTP sent successfully to your phone',
        request_id: response.data.request_id || Date.now().toString(),
      };
    } else {
      throw new Error(response.data.message || 'Failed to send OTP');
    }
  } catch (error) {
    console.error('❌ Fast2SMS Error:', error.response?.data || error.message);

    return {
      success: false,
      status: 'failed',
      message: error.response?.data?.message || error.message || 'Failed to send OTP',
      error: error.message,
    };
  }
}

/**
 * Verify OTP (client-side validation)
 * For production, store OTP in database and verify against stored value
 * @param {string} providedOTP - OTP provided by user
 * @param {string} sentOTP - OTP that was sent
 * @returns {Object} - Verification result
 */
function verifyOTP(providedOTP, sentOTP) {
  try {
    const cleanProvided = providedOTP.replace(/\s/g, '').trim();
    const cleanSent = sentOTP.replace(/\s/g, '').trim();

    if (cleanProvided === cleanSent) {
      return {
        success: true,
        verified: true,
        message: 'OTP verified successfully',
      };
    } else {
      return {
        success: false,
        verified: false,
        message: 'Invalid or expired OTP',
      };
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      verified: false,
      message: 'OTP verification failed',
      error: error.message,
    };
  }
}

module.exports = {
  sendOTP,
  verifyOTP,
};
