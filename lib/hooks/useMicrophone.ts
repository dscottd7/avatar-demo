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
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  toggleMute: () => void;
}

const AUDIO_CHUNK_SIZE = 4096; // Process audio in chunks

export function useMicrophone(config: UseMicrophoneConfig = {}): UseMicrophoneReturn {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);

  /**
   * Request microphone permission and start capturing audio
   */
  const startCapture = useCallback(async () => {
    try {
      console.log('[Microphone] Requesting microphone access...');
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000, // Match OpenAI's expected rate
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setPermissionState('granted');
      console.log('[Microphone] Microphone access granted');

      // Create AudioContext
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      // Create source node from microphone stream
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      // Create processor node for audio capture
      // Note: ScriptProcessorNode is deprecated but still widely supported
      // For production, consider using AudioWorklet
      const processorNode = audioContext.createScriptProcessor(AUDIO_CHUNK_SIZE, 1, 1);
      processorNodeRef.current = processorNode;

      processorNode.onaudioprocess = (e) => {
        if (isMuted || !config.onAudioData) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const sampleRate = audioContext.sampleRate;

        // Process and send audio data
        try {
          const audioBase64 = processAudioForOpenAI(
            inputData,
            sampleRate,
            1 // mono
          );
          config.onAudioData(audioBase64);
        } catch (err) {
          console.error('[Microphone] Error processing audio:', err);
        }
      };

      // Connect nodes: source -> processor -> destination
      sourceNode.connect(processorNode);
      processorNode.connect(audioContext.destination);

      setIsActive(true);
      console.log('[Microphone] Audio capture started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      console.error('[Microphone] Error:', err);
      setError(errorMessage);
      setPermissionState('denied');
      throw err;
    }
  }, [config, isMuted]);

  /**
   * Stop capturing audio and release resources
   */
  const stopCapture = useCallback(() => {
    console.log('[Microphone] Stopping audio capture...');

    // Disconnect and clean up audio nodes
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    setIsActive(false);
    console.log('[Microphone] Audio capture stopped');
  }, []);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      console.log(`[Microphone] Mute ${newMuted ? 'enabled' : 'disabled'}`);
      return newMuted;
    });
  }, []);

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
   * Auto-start if enabled
   */
  useEffect(() => {
    if (config.enabled && !isActive) {
      startCapture().catch(console.error);
    } else if (!config.enabled && isActive) {
      stopCapture();
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
    startCapture,
    stopCapture,
    toggleMute,
  };
}
