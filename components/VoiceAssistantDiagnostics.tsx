// components/VoiceAssistantDiagnostics.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthCheck } from '../services/assistant';

interface DiagnosticResult {
  name: string;
  status: 'checking' | 'success' | 'error';
  message: string;
}

export function VoiceAssistantDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([
    { name: 'Backend Connection', status: 'checking', message: 'Testing...' },
    { name: 'Microphone Permission', status: 'checking', message: 'Testing...' },
    { name: 'Audio Recording', status: 'checking', message: 'Testing...' },
  ]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const runDiagnostics = async () => {
    const results: DiagnosticResult[] = [];

    // Test 1: Backend Connection
    try {
      const health = await healthCheck();
      results.push({
        name: 'Backend Connection',
        status: 'success',
        message: `✅ Backend running on port 3001 (uptime: ${health.uptime?.toFixed(1)}s)`,
      });
    } catch (error) {
      results.push({
        name: 'Backend Connection',
        status: 'error',
        message: `❌ Cannot connect to http://localhost:3001\n\nFix: Make sure to run: npm start in /server directory`,
      });
    }

    // Test 2: Microphone Permission
    try {
      const { Audio } = require('expo-av');
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        results.push({
          name: 'Microphone Permission',
          status: 'success',
          message: '✅ Microphone access granted',
        });
      } else {
        results.push({
          name: 'Microphone Permission',
          status: 'error',
          message: '❌ Microphone permission denied\n\nFix: Enable in device settings',
        });
      }
    } catch (error) {
      results.push({
        name: 'Microphone Permission',
        status: 'error',
        message: `❌ Error checking permission: ${error}`,
      });
    }

    // Test 3: Audio Recording Setup
    try {
      const { Audio } = require('expo-av');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      results.push({
        name: 'Audio Recording',
        status: 'success',
        message: '✅ Audio recording configured',
      });
    } catch (error) {
      results.push({
        name: 'Audio Recording',
        status: 'error',
        message: `❌ Audio setup failed: ${error}`,
      });
    }

    setDiagnostics(results);
  };

  useEffect(() => {
    if (showDiagnostics) {
      runDiagnostics();
    }
  }, [showDiagnostics]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.diagnosticsButton}
        onPress={() => setShowDiagnostics(!showDiagnostics)}
      >
        <Ionicons name="bug" size={20} color="#fff" />
        <Text style={styles.buttonText}>Diagnostics</Text>
      </TouchableOpacity>

      {showDiagnostics && (
        <ScrollView style={styles.diagnosticsPanel}>
          <Text style={styles.title}>🔧 Voice Assistant Diagnostics</Text>
          
          {diagnostics.map((diag, idx) => (
            <View key={idx} style={styles.diagnosticItem}>
              <View style={styles.diagnosticHeader}>
                <Ionicons
                  name={
                    diag.status === 'success'
                      ? 'checkmark-circle'
                      : diag.status === 'error'
                      ? 'close-circle'
                      : 'help-circle'
                  }
                  size={20}
                  color={
                    diag.status === 'success'
                      ? '#34C759'
                      : diag.status === 'error'
                      ? '#FF3B30'
                      : '#FF9500'
                  }
                />
                <Text style={styles.diagnosticName}>{diag.name}</Text>
              </View>
              <Text style={styles.diagnosticMessage}>{diag.message}</Text>
            </View>
          ))}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Setup Checklist:</Text>
            <Text style={styles.infoText}>
              1. Backend must be running on port 3001{'\n'}
              Command: npm start (in /server directory){'\n\n'}
              2. Deepgram API key must be set in server/.env{'\n'}
              Get free key: https://console.deepgram.com{'\n\n'}
              3. Device must have microphone permission{'\n'}
              Settings → Permissions → Microphone
            </Text>
          </View>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={runDiagnostics}
          >
            <Text style={styles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  diagnosticsButton: {
    flexDirection: 'row',
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  diagnosticsPanel: {
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    maxHeight: 400,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
  },
  diagnosticItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  diagnosticName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  diagnosticMessage: {
    fontSize: 12,
    color: '#555',
    marginLeft: 28,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#424242',
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default VoiceAssistantDiagnostics;
