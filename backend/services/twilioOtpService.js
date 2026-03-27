/**
 * Twilio OTP Service
 * Handles real OTP sending and verification using Twilio Verify API
 */

const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client;

try {
  client = twilio(accountSid, authToken);
} catch (error) {
  console.error('Error initializing Twilio client:', error.message);
}

/**
 * Send OTP to a phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., +917209799940)
 * @returns {Promise<Object>} - Result object with success status and message
 */
async function sendOTP(phoneNumber) {
  try {
    if (!client) {
      throw new Error('Twilio client not initialized. Check your credentials.');
    }

    // Validate phone number format
    let formattedPhone = phoneNumber;
    
    // Remove spaces and dashes
    formattedPhone = formattedPhone.replace(/[\s\-()]/g, '');
    
    // If number is 10 digits (Indian), add +91
    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }
    
    // If number doesn't start with +, add it
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    console.log(`📱 Sending OTP to: ${formattedPhone}`);
    console.log(`🔑 Using Verify Service SID: ${verifySid}`);

    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({
        to: formattedPhone,
        channel: 'sms',
      });

    console.log('✅ OTP sent successfully:', {
      status: verification.status,
      to: formattedPhone,
      sid: verification.sid,
    });

    return {
      success: true,
      status: verification.status,
      to: formattedPhone,
      message: 'OTP sent successfully',
      valid: verification.valid,
      sid: verification.sid,
    };
  } catch (error) {
    console.error('❌ Error sending OTP:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error,
    });
    
    return {
      success: false,
      error: error.message,
      message: `Failed to send OTP: ${error.message}`,
    };
  }
}

/**
 * Verify OTP entered by user
 * @param {string} phoneNumber - Phone number with country code
 * @param {string} code - OTP code entered by user
 * @returns {Promise<Object>} - Result object with verification status
 */
async function verifyOTP(phoneNumber, code) {
  try {
    if (!client) {
      throw new Error('Twilio client not initialized. Check your credentials.');
    }

    // Validate phone number format - same as sendOTP
    let formattedPhone = phoneNumber;
    
    // Remove spaces and dashes
    formattedPhone = formattedPhone.replace(/[\s\-()]/g, '');
    
    // If number is 10 digits (Indian), add +91
    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }
    
    // If number doesn't start with +, add it
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    console.log(`🔍 Verifying OTP for: ${formattedPhone}`);

    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({
        to: formattedPhone,
        code: code.toString().trim(),
      });

    console.log('✅ OTP verification result:', {
      status: verificationCheck.status,
      valid: verificationCheck.valid,
    });

    return {
      success: verificationCheck.status === 'approved',
      status: verificationCheck.status,
      valid: verificationCheck.valid,
      to: formattedPhone,
      message:
        verificationCheck.status === 'approved'
          ? 'OTP verified successfully'
          : 'Invalid or expired OTP',
    };
  } catch (error) {
    console.error('❌ Error verifying OTP:', {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    
    return {
      success: false,
      error: error.message,
      message: `Failed to verify OTP: ${error.message}`,
    };
  }
}

module.exports = {
  sendOTP,
  verifyOTP,
};
