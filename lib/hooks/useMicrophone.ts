/**
 * useMicrophone Hook
 * Handles microphone access, audio capture, and streaming
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { processAudioForOpenAI } from '@/lib/openai/audio';

interface UseMicrophoneConfig {
  onAudioData?: (audioBase64: string) => void;
  enabled?: boolean;
}

interface UseMicrophoneReturn {
  isActive: boolean;
  isMuted: boolean;
  error: string | null;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  stream: MediaStream | null;
  track: MediaStreamTrack | null;
  startCapture: () => Promise<MediaStream>;
  stopCapture: () => void;
  toggleMute: () => void;
}

const AUDIO_CHUNK_SIZE = 4096; // Process audio in chunks

export function useMicrophone(config: UseMicrophoneConfig = {}): UseMicrophoneReturn {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);

  /**
   * Request microphone permission and start capturing audio
   * @returns The MediaStream from the microphone
   */
  const startCapture = useCallback(async (): Promise<MediaStream> => {
    try {
      console.log('[Microphone] Requesting microphone access...');
      setError(null);

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000, // Match OpenAI's expected rate
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const audioTrack = newStream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('No audio track found in the microphone stream.');
      }

      setStream(newStream);
      setTrack(audioTrack);
      setPermissionState('granted');
      setIsActive(true);
      console.log('[Microphone] Audio capture started');

      // If a data callback is provided, set up processing
      if (config.onAudioData) {
        console.log('[Microphone] Setting up audio data processing for callback');
        const audioContext = new AudioContext({ sampleRate: 24000 });
        const sourceNode = audioContext.createMediaStreamSource(newStream);
        const processorNode = audioContext.createScriptProcessor(AUDIO_CHUNK_SIZE, 1, 1);

        processorNode.onaudioprocess = (e) => {
          if (isMuted || !config.onAudioData) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const audioBase64 = processAudioForOpenAI(inputData, audioContext.sampleRate, 1);
          config.onAudioData(audioBase64);
        };

        sourceNode.connect(processorNode);
        processorNode.connect(audioContext.destination);

        audioContextRef.current = audioContext;
        sourceNodeRef.current = sourceNode;
        processorNodeRef.current = processorNode;
      }

      return newStream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      console.error('[Microphone] Error:', err);
      setError(errorMessage);
      setPermissionState('denied');
      throw err;
    }
  }, [config.onAudioData, isMuted]);

  // Use a ref to track the stream for cleanup without causing re-renders
  const streamRef = useRef<MediaStream | null>(null);

  // Keep streamRef in sync with stream state
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  /**
   * Stop capturing audio and release resources
   */
  const stopCapture = useCallback(() => {
    console.log('[Microphone] Stopping audio capture...');

    if (processorNodeRef.current) processorNodeRef.current.disconnect();
    if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close().catch(console.error);

    // Use ref to avoid dependency on stream state
    streamRef.current?.getTracks().forEach((track) => track.stop());

    setStream(null);
    setTrack(null);
    setIsActive(false);
    console.log('[Microphone] Audio capture stopped');
  }, []);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (track) {
        track.enabled = !newMuted;
      }
      console.log(`[Microphone] Mute ${newMuted ? 'enabled' : 'disabled'}`);
      return newMuted;
    });
  }, [track]);

  /**
   * Check microphone permission on mount
   */
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          setPermissionState(permissionStatus.state as any);

          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state as any);
          };
        })
        .catch(() => {
          // Permission API not supported, remain unknown
          setPermissionState('unknown');
        });
    }
  }, []);

  /**
   * Auto-start if enabled prop is explicitly set to true
   * Note: We only auto-stop if enabled was previously true and becomes false.
   * This allows manual control via startCapture/stopCapture when enabled is undefined.
   */
  const wasEnabledRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    // Only react to explicit enabled prop changes, not undefined
    if (config.enabled === undefined) {
      return;
    }

    if (config.enabled && !isActive) {
      startCapture().catch(console.error);
      wasEnabledRef.current = true;
    } else if (!config.enabled && wasEnabledRef.current) {
      stopCapture();
      wasEnabledRef.current = false;
    }
  }, [config.enabled, isActive, startCapture, stopCapture]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    isActive,
    isMuted,
    error,
    permissionState,
    stream,
    track,
    startCapture,
    stopCapture,
    toggleMute,
  };
}
