// components/VoiceRecorder.tsx
import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  AppState,
  AppStateStatus,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { TRANSCRIBE_URL, PARSE_URL } from "../services/assistant";
import * as Speech from "expo-speech";
import { useNavigation } from "@react-navigation/native";
import { stopWakeWordDetection, startWakeWordDetection } from "../hooks/useWakeWord";
import { useNetwork } from "@/hooks/useNetwork";

export type VoiceRecorderHandle = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isRecording: () => boolean;
};

export interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  onStateChange?: (isRecording: boolean, isSending: boolean) => void;
  useAssistantEndpoint?: boolean;
  enableAssistantFlow?: boolean;
  showUI?: boolean;
  primaryColor?: string;
}

const VoiceRecorder = forwardRef<VoiceRecorderHandle, VoiceRecorderProps>(
  (
    {
      onTranscribed,
      onStateChange,
      useAssistantEndpoint = true,
      enableAssistantFlow = false,
      showUI = true,
      primaryColor = "#007AFF",
    },
    ref
  ) => {
    const navigation = useNavigation<any>();
    const { isConnected, isWeak } = useNetwork();

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [status, setStatus] = useState<"idle" | "recording" | "sending">(
      "idle"
    );
    const recordingRef = useRef<Audio.Recording | null>(null);
    const isPreparingRef = useRef<boolean>(false);
    const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const recordingStartTimeRef = useRef<number | null>(null);
    const maxRecordingDurationMs = 30000; // 30 second max recording (NexaVault pattern)

    // Keep ref in sync with state for cleanup
    useEffect(() => {
      recordingRef.current = recording;
    }, [recording]);

    // PERMANENT FIX: Completely disable wake word detection while VoiceRecorder is mounted
    // This prevents microphone resource conflicts at the native level
    useEffect(() => {
      stopWakeWordDetection();
      
      return () => {
        // Re-enable when component unmounts
        startWakeWordDetection();
      };
    }, []);

    // NexaVault Pattern: Timeout-based force cleanup (critical for stability)
    // If recording goes over 30 seconds, force stop and cleanup
    useEffect(() => {
      if (status === "recording") {
        recordingStartTimeRef.current = Date.now();
        
        recordingTimeoutRef.current = setTimeout(async () => {
          console.warn(
            "⏰ Recording timeout (30s exceeded). Force stopping..."
          );
          try {
            if (recordingRef.current) {
              await recordingRef.current.stopAndUnloadAsync();
              console.log("⏰ Recording forcefully stopped");
            }
          } catch (err) {
            console.error("⏰ Force stop failed:", err);
          }
          setRecording(null);
          setStatus("idle");
          onStateChange?.(false, false);
          Alert.alert(
            "Recording Timeout",
            "Recording exceeded 30 seconds and was stopped automatically."
          );
        }, maxRecordingDurationMs);
      }

      return () => {
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
      };
    }, [status, onStateChange]);

    // Handle app going to background - stop recording
    useEffect(() => {
      const handleAppStateChange = async (nextAppState: AppStateStatus) => {
        if (nextAppState === "background" || nextAppState === "inactive") {
          if (recordingRef.current) {
            console.log("🎤 App backgrounded, stopping recording...");
            try {
              await recordingRef.current.stopAndUnloadAsync();
            } catch (e) {
              // Ignore
            }
            setRecording(null);
            setStatus("idle");
            onStateChange?.(false, false);
          }
        }
      };

      const subscription = AppState.addEventListener("change", handleAppStateChange);
      return () => {
        subscription.remove();
      };
    }, [onStateChange]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (cleanupTimerRef.current) {
          clearTimeout(cleanupTimerRef.current);
        }
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
        }
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch(() => {});
          recordingRef.current = null;
        }
      };
    }, []);

    // -----------------------------
    // 🟢 START RECORDING
    // -----------------------------
    async function startRecording() {
      // Prevent overlapping start calls which can trigger
      // "Only one Recording object can be prepared" errors
      if (status !== "idle" || isPreparingRef.current) {
        console.log("🎤 Already recording or sending, ignoring start request");
        return;
      }

      // Cancel any pending cleanup timers
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }

      try {
        isPreparingRef.current = true;

        // NexaVault Pattern: Network pre-flight check
        // Don't start recording if network is offline or very weak
        console.log("📡 Checking network connectivity...");
        if (!isConnected || isWeak) {
          Alert.alert(
            "Network Issue",
            "Voice assistant unavailable due to weak or no internet connection. Please type your request or try again later."
          );
          isPreparingRef.current = false;
          return;
        }
        console.log("📡 Network ready");
        
        // AGGRESSIVE CLEANUP: Unload ALL audio objects immediately (NexaVault pattern)
        await Audio.setIsEnabledAsync(false);
        
        // Best-effort cleanup of stale recording objects
        if (recordingRef.current) {
          try {
            await recordingRef.current.stopAndUnloadAsync();
          } catch (e) {
            console.log("🎤 Cleanup warning:", e);
          }
          recordingRef.current = null;
        }

        if (recording) {
          try {
            await recording.stopAndUnloadAsync();
          } catch (e) {
            console.log("🎤 Cleanup warning:", e);
          }
          setRecording(null);
        }

        // Give native layer 300ms to fully release resources
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Re-enable audio
        await Audio.setIsEnabledAsync(true);

        console.log("🎤 Requesting mic permissions…");
        const { status: permStatus } = await Audio.requestPermissionsAsync();
        if (permStatus !== "granted") {
          Alert.alert(
            "Microphone Permission Required",
            "Enable microphone permission in settings."
          );
          isPreparingRef.current = false;
          return;
        }
        console.log("🎤 Permissions granted");

        // Set audio mode for recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        console.log("🎤 Creating new recording instance...");
        const { recording: newRecording } = await Audio.Recording.createAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          web: {
            mimeType: 'audio/webm;codecs=opus',
            bitsPerSecond: 128000,
          },
        });

        setRecording(newRecording);
        setStatus("recording");
        onStateChange?.(true, false);

        console.log("🎤 Recording started!");

      } catch (err: any) {
        console.error("🚨 Recording start error:", err);
        Alert.alert(
          "Recording Error",
          err?.message?.includes("Only one Recording") 
            ? "Please wait a moment and try again." 
            : "Could not start recording. Please try again."
        );
        setStatus("idle");
        onStateChange?.(false, false);
      } finally {
        isPreparingRef.current = false;
      }
    }

    // -----------------------------
    // 🛑 STOP RECORDING
    // -----------------------------
    async function stopRecording() {
      if (!recording) {
        console.log("🎤 No active recording to stop");
        return;
      }

      console.log("🎤 Stopping recording...");
      setStatus("sending");
      onStateChange?.(false, true);

      try {
        // Cancel recording timeout if still active
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }

        const recordingDuration =
          Date.now() - (recordingStartTimeRef.current || 0);
        console.log(`🎤 Recording duration: ${recordingDuration}ms`);

        if (recordingDuration < 500) {
          Alert.alert(
            "Recording Too Short",
            "Please record at least 0.5 seconds of audio."
          );
          setStatus("idle");
          onStateChange?.(false, false);
          return;
        }

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        // Now that it's stopped and unloaded, clear the state
        setRecording(null);

        console.log("🎤 File URI:", uri);
        if (!uri) throw new Error("No audio file URI");

        // Send audio file directly using FormData - no expo-file-system needed!
        console.log("🎤 Preparing audio upload:", uri);
        
        const formData = new FormData();
        formData.append('audio', {
          uri: uri,
          type: 'audio/m4a', // or audio/wav depending on your recording format
          name: 'recording.m4a',
        } as any);

        console.log("🎤 Sending audio to:", TRANSCRIBE_URL);

        const res = await fetch(TRANSCRIBE_URL, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("🚨 Server error response:", res.status, errorText);
          let errorObj;
          try {
            errorObj = JSON.parse(errorText);
          } catch {
            errorObj = { error: errorText };
          }
          throw new Error(`Server error ${res.status}: ${errorObj.error || errorObj.detail || errorText}`);
        }

        const json = await res.json();
        const text = json?.text || "";
        const confidence = json?.confidence || 0;

        console.log("📝 Transcribed text:", text);
        console.log(`📊 Confidence score: ${(confidence * 100).toFixed(1)}%`);

        // NexaVault Pattern: Filter out low confidence transcriptions
        if (confidence < 0.5 && text.trim()) {
          console.warn("⚠️  Low confidence transcription, requesting retry");
          Alert.alert(
            "Unclear Audio",
            "Please speak more clearly and try again."
          );
          return;
        }

        if (text.trim()) {
          onTranscribed(text);
        } else {
          Alert.alert("No Speech Detected", "Please try speaking again.");
        }

      } catch (err) {
        console.error("🚨 Stop recording/transcription error:", err);
        console.error("Error details:", {
          message: err?.message,
          type: err?.constructor?.name,
        });
        
        // NexaVault Pattern: Classify errors and provide recovery suggestions
        let errorCode = "UNKNOWN";
        let errorMsg = "Failed to process audio.";
        let errorTitle = "❌ Recording Error";
        let recoverable = true;

        if (err instanceof TypeError || err?.message?.includes("Failed to fetch")) {
          errorCode = "BACKEND_OFFLINE";
          errorTitle = "❌ Backend Connection Error";
          errorMsg =
            "Cannot reach http://localhost:3001\n\n" +
            "To fix:\n" +
            "1. Open PowerShell\n" +
            "2. cd C:\\Users\\DebSarkar\\Desktop\\KAVACH-main\\server\n" +
            "3. node simple-voice-server.js\n" +
            "4. Should show: '✅ Server listening'\n" +
            "5. Then try again";
          recoverable = true;
        } else if (err?.message?.includes("Server error 400") || err?.message?.includes("corrupt or unsupported data")) {
          errorCode = "AUDIO_FORMAT_ERROR";
          errorTitle = "🎤 Audio Format Error";
          errorMsg = "Audio format not supported by Deepgram.\n\nTry recording again with clear speech.";
          recoverable = true;
        } else if (err?.message?.includes("Server error 429")) {
          errorCode = "RATE_LIMITED";
          errorTitle = "⏳ Rate Limit Exceeded";
          errorMsg = "Too many requests to Deepgram.\n\n" + "Please wait 10 seconds and try again.";
          recoverable = true;
        } else if (err?.message?.includes("Server error 401")) {
          errorCode = "DEEPGRAM_AUTH_FAILED";
          errorTitle = "❌ API Configuration Error";
          errorMsg =
            "Deepgram API key invalid or expired.\n\n" +
            "Check server/.env:\n" +
            "DEEPGRAM_API_KEY=your_key_here";
          recoverable = true;
        } else if (err?.message?.includes("Server error")) {
          errorCode = "TRANSCRIPTION_FAILED";
          errorTitle = "❌ Transcription Error";
          errorMsg =
            "Backend error processing audio\n\n" +
            "Check:\n" +
            "• server/.env has DEEPGRAM_API_KEY\n" +
            "• Backend is still running\n" +
            "• Try again";
          recoverable = true;
        } else if (err?.message?.includes("No audio file URI")) {
          errorCode = "AUDIO_SAVE_FAILED";
          errorTitle = "❌ Recording Failed";
          errorMsg =
            "Could not save audio\n\n" + "Try:\n" + "• Check microphone permission\n" + "• Check device storage\n" + "• Restart app";
          recoverable = true;
        } else if (err?.message?.includes("Recording too short")) {
          errorCode = "AUDIO_TOO_SHORT";
          errorTitle = "🔊 Recording Too Short";
          errorMsg = "Please record at least 0.5 seconds of audio.";
          recoverable = true;
        }

        console.log(`📋 Error Classification: ${errorCode} (recoverable: ${recoverable})`);
        Alert.alert(errorTitle, errorMsg);
      } finally {
        // Cancel recording timeout if active
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }

        setStatus("idle");
        onStateChange?.(false, false);
        
        // NexaVault Pattern: Delayed cleanup to ensure complete resource release (critical for stability)
        cleanupTimerRef.current = setTimeout(async () => {
          try {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
            });
            console.log("✨ Audio cleanup complete");
          } catch (e) {
            console.log("🎤 Audio mode reset warning:", e);
          }
        }, 100);
      }
    }

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      start: startRecording,
      stop: stopRecording,
      isRecording: () => status === "recording",
    }));

    // UI
    if (!showUI) return null;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: status === "recording" ? "#FF3B30" : primaryColor },
          ]}
          disabled={status === "sending"}
          onPress={() => {
            if (status === "recording") stopRecording();
            else startRecording();
          }}
          testID="record-button"
        >
          {status === "sending" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons
              name={status === "recording" ? "stop" : "mic"}
              size={28}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        <Text style={styles.statusText}>
          {status === "idle" && "Tap to speak"}
          {status === "recording" && "Recording..."}
          {status === "sending" && "Processing audio…"}
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 12 },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: { marginTop: 8, fontSize: 14, color: "#666" },
});

VoiceRecorder.displayName = "VoiceRecorder";
export default VoiceRecorder;
