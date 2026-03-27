import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      startAsync: jest.fn().mockResolvedValue(undefined),
      stopAndUnloadAsync: jest.fn().mockResolvedValue({ uri: 'mock-audio-uri' }),
      getStatusAsync: jest.fn().mockResolvedValue({ isRecording: false }),
    })),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((path) => ({
    text: jest.fn().mockResolvedValue('mock-file-content'),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
  })),
  Directory: jest.fn(),
  documentDirectory: 'mock-document-directory/',
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('mock-file-content'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  documentDirectory: 'mock-document-directory/',
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Mock network hook
jest.mock('@/hooks/useNetwork', () => ({
  useNetwork: () => ({
    isConnected: true,
    isInternetReachable: true,
  }),
}));

// Mock wake word detection
jest.mock('../hooks/useWakeWord', () => ({
  stopWakeWordDetection: jest.fn(),
  startWakeWordDetection: jest.fn(),
}));

// Global fetch mock
global.fetch = jest.fn();

// Silence console warnings during tests
console.warn = jest.fn();
console.error = jest.fn();