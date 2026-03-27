import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import VoiceRecorder, { VoiceRecorderHandle } from '../../components/VoiceRecorder';

// Mock the assistant service
jest.mock('../../services/assistant', () => ({
  TRANSCRIBE_URL: 'http://localhost:3001/assistant/transcribe',
  PARSE_URL: 'http://localhost:3001/assistant/parse',
}));

describe('VoiceRecorder Component', () => {
  const mockOnTranscribed = jest.fn();
  const mockOnStateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  const renderVoiceRecorder = (props = {}) => {
    return render(
      <VoiceRecorder
        onTranscribed={mockOnTranscribed}
        onStateChange={mockOnStateChange}
        showUI={true}
        {...props}
      />
    );
  };

  test('renders recording button correctly', () => {
    const { getByTestId } = renderVoiceRecorder();
    const recordButton = getByTestId('record-button');
    expect(recordButton).toBeTruthy();
  });

  test('starts recording on button press', async () => {
    const { getByTestId } = renderVoiceRecorder();
    const recordButton = getByTestId('record-button');
    
    await act(async () => {
      fireEvent.press(recordButton);
    });

    // Check if onStateChange was called with recording state
    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(true, false);
    });
  });

  test('stops recording and shows processing state', async () => {
    const { getByTestId } = renderVoiceRecorder();
    const recordButton = getByTestId('record-button');
    
    // Start recording
    await act(async () => {
      fireEvent.press(recordButton);
    });

    // Stop recording
    await act(async () => {
      fireEvent.press(recordButton);
    });

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(false, true);
    });
  });

  test('handles transcription success', async () => {
    const mockTranscriptionResponse = {
      text: 'send 500 to rahul',
      confidence: 0.95,
      success: true
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTranscriptionResponse),
    });

    const { getByTestId } = renderVoiceRecorder();
    const recordButton = getByTestId('record-button');
    
    // Start and stop recording
    await act(async () => {
      fireEvent.press(recordButton);
    });
    
    await act(async () => {
      fireEvent.press(recordButton);
    });

    await waitFor(() => {
      expect(mockOnTranscribed).toHaveBeenCalledWith('send 500 to rahul');
    });
  });

  test('handles transcription with low confidence', async () => {
    const mockLowConfidenceResponse = {
      text: 'unclear audio',
      confidence: 0.3,
      success: true
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLowConfidenceResponse),
    });

    const { getByTestId } = renderVoiceRecorder();
    const recordButton = getByTestId('record-button');
    
    await act(async () => {
      fireEvent.press(recordButton);
    });
    
    await act(async () => {
      fireEvent.press(recordButton);
    });

    await waitFor(() => {
      // Should not call onTranscribed for low confidence
      expect(mockOnTranscribed).not.toHaveBeenCalled();
    });
  });

  test('handles network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByTestId } = renderVoiceRecorder();
    const recordButton = getByTestId('record-button');
    
    await act(async () => {
      fireEvent.press(recordButton);
    });
    
    await act(async () => {
      fireEvent.press(recordButton);
    });

    await waitFor(() => {
      // Should return to ready state on error
      expect(mockOnStateChange).toHaveBeenCalledWith(false, false);
    });
  });

  test('handles ref methods correctly', async () => {
    const ref = React.createRef<VoiceRecorderHandle>();
    
    render(
      <VoiceRecorder
        ref={ref}
        onTranscribed={mockOnTranscribed}
        showUI={true}
      />
    );

    // Test ref methods
    expect(ref.current?.isRecording()).toBe(false);
    
    await act(async () => {
      await ref.current?.start();
    });
    
    expect(ref.current?.isRecording()).toBe(true);
    
    await act(async () => {
      await ref.current?.stop();
    });
    
    expect(ref.current?.isRecording()).toBe(false);
  });

  test('shows appropriate UI states', async () => {
    const { getByTestId, getByText } = renderVoiceRecorder();
    const recordButton = getByTestId('record-button');
    
    // Initial state - should show "Tap to speak"
    expect(getByText('Tap to speak')).toBeTruthy();
    
    // Recording state
    await act(async () => {
      fireEvent.press(recordButton);
    });
    
    await waitFor(() => {
      expect(getByText('Recording...')).toBeTruthy();
    });
  });
});