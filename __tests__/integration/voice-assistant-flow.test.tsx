import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VoiceAssistantScreen from '../../screens/VoiceAssistantScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Mock theme context
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#007AFF',
      background: '#FFFFFF',
      text: '#000000',
      card: '#F2F2F7',
    },
    isDark: false,
  }),
}));

// Mock language context
jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

describe('Voice Assistant Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          text: 'send 500 to rahul',
          confidence: 0.95,
          success: true
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          intent: 'send_money',
          entities: {
            amount: '500',
            recipient: 'rahul'
          },
          confidence: 0.92,
          replyText: 'Okay, sending ₹500 to rahul.',
          actionSuggested: 'prefill_and_navigate_upi'
        }),
      });
  });

  test('complete voice assistant flow: record → transcribe → parse → navigate', async () => {
    const { getByTestId, getByText } = render(<VoiceAssistantScreen />);
    
    // Find and press the record button
    const recordButton = getByTestId('record-button');
    expect(recordButton).toBeTruthy();
    
    // Start recording
    fireEvent.press(recordButton);
    
    // Should show recording state
    await waitFor(() => {
      expect(getByText('Recording...')).toBeTruthy();
    });
    
    // Stop recording
    fireEvent.press(recordButton);
    
    // Should show processing state
    await waitFor(() => {
      expect(getByText('Processing audio…')).toBeTruthy();
    });
    
    // Wait for transcription and parsing to complete
    await waitFor(() => {
      // Should display the transcribed text
      expect(getByText('send 500 to rahul')).toBeTruthy();
    }, { timeout: 5000 });
    
    await waitFor(() => {
      // Should display the parsed response
      expect(getByText('Okay, sending ₹500 to rahul.')).toBeTruthy();
    });
    
    // Should have called the APIs in correct order
    expect(global.fetch).toHaveBeenCalledTimes(2);
    
    // First call should be transcription
    expect(global.fetch).toHaveBeenNthCalledWith(1,
      'http://localhost:3001/assistant/transcribe',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      })
    );
    
    // Second call should be parsing
    expect(global.fetch).toHaveBeenNthCalledWith(2,
      'http://localhost:3001/assistant/parse',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'send 500 to rahul' })
      })
    );
  });

  test('handles low confidence transcription gracefully', async () => {
    // Mock low confidence response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        text: 'unclear speech',
        confidence: 0.3,
        success: true
      }),
    });

    const { getByTestId, getByText } = render(<VoiceAssistantScreen />);
    
    const recordButton = getByTestId('record-button');
    
    // Record and stop
    fireEvent.press(recordButton);
    fireEvent.press(recordButton);
    
    // Should show appropriate message for low confidence
    await waitFor(() => {
      expect(getByText(/didn't catch that|try again/i)).toBeTruthy();
    });
  });

  test('handles network errors with proper fallback', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByTestId, getByText } = render(<VoiceAssistantScreen />);
    
    const recordButton = getByTestId('record-button');
    
    // Record and stop
    fireEvent.press(recordButton);
    fireEvent.press(recordButton);
    
    // Should show network error message
    await waitFor(() => {
      expect(getByText(/network error|connection/i)).toBeTruthy();
    });
  });
});