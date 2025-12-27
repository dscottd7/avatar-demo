/**
 * useKaiSession Hook
 * The main orchestration hook that combines HeyGen, OpenAI (WebRTC), and Microphone.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useHeygenSession } from './useHeygenSession';
import { useOpenAIWebRTC } from './useOpenAIWebRTC';
import { useMicrophone } from './useMicrophone';
import { useAppStore } from '@/lib/stores/useAppStore';
import { processAudioForOpenAI } from '@/lib/openai/audio';

interface UseKaiSessionReturn {
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  toggleMute: () => void;
  interrupt: () => void;
  isSessionActive: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isMuted: boolean;
  error: string | null;
  attachVideo: (videoElement: HTMLVideoElement) => void;
  isStreamReady: boolean;
}

export function useKaiSession(): UseKaiSessionReturn {
  const sessionActive = useAppStore((state) => state.sessionActive);
  const setSessionActive = useAppStore((state) => state.setSessionActive);

  // === Child Hooks ===
  const {
    startSession: startHeygenSession,
    stopSession: stopHeygenSession,
    sendAudioToAvatar,
    interrupt,
    attachVideo,
    isStreamReady,
    isConnecting: heygenConnecting,
    error: heygenError,
  } = useHeygenSession();

  const {
    connect: connectOpenAI,
    disconnect: disconnectOpenAI,
    addMicrophoneTrack,
    remoteAudioStream,
    isConnecting: openaiConnecting,
    error: openaiError,
  } = useOpenAIWebRTC();

  const {
    stream: microphoneStream,
    track: microphoneTrack,
    toggleMute,
    isMuted,
    isActive: isMicrophoneActive,
    startCapture: startMicrophone,
    stopCapture: stopMicrophone,
    error: microphoneError,
  } = useMicrophone();

  // === Audio Processing for OpenAI -> HeyGen ===
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Only set up audio processing when both OpenAI stream and HeyGen session are ready
    if (!remoteAudioStream || !isStreamReady) return;

    console.log('[Kai Session] Both OpenAI stream and HeyGen ready. Setting up audio processor...');
    const audioContext = new AudioContext({ sampleRate: 24000 });
    const source = audioContext.createMediaStreamSource(remoteAudioStream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    // Threshold to detect silence (avoid sending empty audio that causes avatar flickering)
    const SILENCE_THRESHOLD = 0.01;

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);

      // Check if there's actual audio content (not just silence)
      let maxAmplitude = 0;
      for (let i = 0; i < inputData.length; i++) {
        const abs = Math.abs(inputData[i]);
        if (abs > maxAmplitude) maxAmplitude = abs;
      }

      // Only send audio if it's above the silence threshold
      if (maxAmplitude > SILENCE_THRESHOLD) {
        const audioBase64 = processAudioForOpenAI(inputData, audioContext.sampleRate, 1);
        sendAudioToAvatar(audioBase64);
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    audioContextRef.current = audioContext;

    return () => {
      console.log('[Kai Session] Cleaning up remote audio processor...');
      processor.disconnect();
      source.disconnect();
      audioContext.close();
    };
  }, [remoteAudioStream, isStreamReady, sendAudioToAvatar]);

  // === Main Session Control Logic ===
  const startSession = useCallback(async () => {
    console.log('[Kai Session] Starting complete session...');
    setSessionActive(true);
    try {
      // Start HeyGen and microphone in parallel (they're independent)
      console.log('[Kai Session] Starting HeyGen session and microphone...');
      const [, micStream] = await Promise.all([
        startHeygenSession(),
        startMicrophone(),
      ]);

      // Now connect to OpenAI with the microphone stream
      // This ensures the audio track is included in the SDP offer
      console.log('[Kai Session] Connecting to OpenAI with microphone stream...');
      await connectOpenAI(micStream);

      console.log('[Kai Session] Session fully initialized');
    } catch (err) {
      console.error('[Kai Session] Error starting session:', err);
      await stopSession(); // Cleanup on failure
      throw err;
    }
  }, [setSessionActive, startHeygenSession, connectOpenAI, startMicrophone]);

  const stopSession = useCallback(async () => {
    console.log('[Kai Session] Stopping complete session...');
    await Promise.allSettled([
      stopHeygenSession(),
      disconnectOpenAI(),
      Promise.resolve(stopMicrophone()),
    ]);
    setSessionActive(false);
    console.log('[Kai Session] Session stopped');
  }, [stopHeygenSession, disconnectOpenAI, stopMicrophone, setSessionActive]);

  const error = heygenError || openaiError || microphoneError;
  const isConnecting = heygenConnecting || openaiConnecting;

  return {
    startSession,
    stopSession,
    toggleMute,
    interrupt,
    isSessionActive: sessionActive,
    isConnecting,
    isMicrophoneActive,
    isMuted,
    error,
    attachVideo,
    isStreamReady,
  };
}