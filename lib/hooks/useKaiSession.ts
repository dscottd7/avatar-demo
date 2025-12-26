/**
 * useKaiSession Hook
 * Orchestrates HeyGen and OpenAI integration for the Kai avatar
 * Manages the complete conversation flow between user, OpenAI, and HeyGen
 *
 * ⚠️ SECURITY NOTE: This implementation uses client-side OpenAI API key
 * for rapid prototyping. NOT suitable for production.
 * See Phase 6 for secure token-based approach.
 */

import { useCallback } from 'react';
import { useHeygenSession } from './useHeygenSession';
import { useOpenAIRealtime } from './useOpenAIRealtime';
import { useMicrophone } from './useMicrophone';
import { useAppStore } from '@/lib/stores/useAppStore';

interface UseKaiSessionConfig {
  openaiApiKey: string;
  autoStartMicrophone?: boolean;
}

interface UseKaiSessionReturn {
  // Session control
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;

  // Audio control
  toggleMute: () => void;
  interrupt: () => void;

  // State
  isSessionActive: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isMuted: boolean;
  error: string | null;

  // Video attachment
  attachVideo: (videoElement: HTMLVideoElement) => void;
  isStreamReady: boolean;
}

export function useKaiSession(config: UseKaiSessionConfig): UseKaiSessionReturn {
  const sessionActive = useAppStore((state) => state.heygenConnected || state.openaiConnected);

  // HeyGen session management
  const {
    startSession: startHeygenSession,
    stopSession: stopHeygenSession,
    speak,
    interrupt,
    attachVideo,
    isStreamReady,
    isConnecting: heygenConnecting,
    error: heygenError,
  } = useHeygenSession();

  // OpenAI Realtime connection
  const {
    connect: connectOpenAI,
    disconnect: disconnectOpenAI,
    sendAudio,
    isConnecting: openaiConnecting,
    error: openaiError,
  } = useOpenAIRealtime({
    apiKey: config.openaiApiKey,
    onAudioResponse: (audioBase64) => {
      // When OpenAI sends audio response, forward it to HeyGen for lip-sync
      // Note: HeyGen LiveAvatar handles playback internally, but we could
      // potentially use the audioBase64 for custom playback if needed
      console.log('[Kai Session] Received audio from OpenAI, length:', audioBase64.length);

      // For now, we'll log this. In a future iteration, we might need to:
      // 1. Decode the audio
      // 2. Play it through HeyGen's avatar
      // 3. Or handle it differently based on HeyGen's SDK capabilities
    },
    onTranscriptUpdate: (transcript, isUser) => {
      console.log(`[Kai Session] Transcript update (${isUser ? 'User' : 'Assistant'}):`, transcript);

      // When we get assistant transcript, we can send it to HeyGen to speak
      if (!isUser && transcript) {
        try {
          speak(transcript);
        } catch (err) {
          console.error('[Kai Session] Error sending transcript to HeyGen:', err);
        }
      }
    },
  });

  // Microphone management
  const {
    toggleMute,
    isMuted,
    isActive: isMicrophoneActive,
    error: microphoneError,
  } = useMicrophone({
    onAudioData: (audioBase64) => {
      // Stream microphone audio to OpenAI
      sendAudio(audioBase64);
    },
    enabled: sessionActive && config.autoStartMicrophone,
  });

  /**
   * Start the complete Kai session (HeyGen + OpenAI + Microphone)
   */
  const startSession = useCallback(async () => {
    console.log('[Kai Session] Starting complete session...');

    try {
      // Start HeyGen session first
      await startHeygenSession();
      console.log('[Kai Session] HeyGen session started');

      // Connect to OpenAI
      await connectOpenAI();
      console.log('[Kai Session] OpenAI connected');

      console.log('[Kai Session] Session fully initialized');
    } catch (err) {
      console.error('[Kai Session] Error starting session:', err);
      // Clean up if partial initialization
      await stopSession();
      throw err;
    }
  }, [startHeygenSession, connectOpenAI]);

  /**
   * Stop the complete Kai session and cleanup all resources
   */
  const stopSession = useCallback(async () => {
    console.log('[Kai Session] Stopping complete session...');

    // Stop all services in parallel
    await Promise.all([
      stopHeygenSession(),
      disconnectOpenAI(),
    ]);

    console.log('[Kai Session] Session stopped');
  }, [stopHeygenSession, disconnectOpenAI]);

  // Combined error state
  const error = heygenError || openaiError || microphoneError;

  // Combined connecting state
  const isConnecting = heygenConnecting || openaiConnecting;

  return {
    // Session control
    startSession,
    stopSession,

    // Audio control
    toggleMute,
    interrupt,

    // State
    isSessionActive: sessionActive,
    isConnecting,
    isMicrophoneActive,
    isMuted,
    error,

    // Video
    attachVideo,
    isStreamReady,
  };
}
