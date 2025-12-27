/**
 * useOpenAIWebRTC Hook
 * Manages the OpenAI WebRTC connection, media tracks, and message handling.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { OpenAIWebRTCClient, RealtimeEvent } from '@/lib/openai/webrtc';
import { useAppStore } from '@/lib/stores/useAppStore';
import { avatarConfig } from '@/config/avatar.config';

interface UseOpenAIWebRTCReturn {
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connect: (localStream?: MediaStream) => Promise<void>;
  disconnect: () => void;
  addMicrophoneTrack: (track: MediaStreamTrack, stream: MediaStream) => void;
  sendMessage: (event: RealtimeEvent) => void;
  remoteAudioStream: MediaStream | null;
}

export function useOpenAIWebRTC(): UseOpenAIWebRTCReturn {
  const clientRef = useRef<OpenAIWebRTCClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteAudioStream, setRemoteAudioStream] = useState<MediaStream | null>(null);

  const setOpenaiConnected = useAppStore((state) => state.setOpenaiConnected);
  const setSessionState = useAppStore((state) => state.setSessionState);
  const setStoreError = useAppStore((state) => state.setError);
  const addMessage = useAppStore((state) => state.addMessage);

  const connect = useCallback(async (localStream?: MediaStream) => {
    if (clientRef.current) {
      console.log('[WebRTC Hook] Already connected or connecting');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setStoreError(null);
      setSessionState('connecting');

      console.log('[WebRTC Hook] Initializing WebRTC client...');
      const client = new OpenAIWebRTCClient();
      clientRef.current = client;

      // Set up event listeners
      client.on('connectionstatechange', (state) => {
        console.log(`[WebRTC Hook] Connection state changed: ${state}`);
        if (state === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          setOpenaiConnected(true);
          setSessionState('connected');
        } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          setIsConnected(false);
          setIsConnecting(false);
          setOpenaiConnected(false);
          setSessionState('disconnected');
        }
      });

      client.on('track', (track) => {
        console.log('[WebRTC Hook] Received remote audio track:', track.kind, track.readyState);
        const stream = new MediaStream([track]);
        setRemoteAudioStream(stream);
      });

      // Handle messages from OpenAI (transcriptions, responses, etc.)
      client.on('message', (event) => {
        console.log('[WebRTC Hook] Message event:', event.type);

        // When session is created, update it with our configuration
        if (event.type === 'session.created') {
          console.log('[WebRTC Hook] Session created, sending configuration...');
          client.sendMessage({
            type: 'session.update',
            session: {
              instructions: avatarConfig.systemPrompt,
              voice: avatarConfig.openai.voice,
              input_audio_transcription: {
                model: 'whisper-1',
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
              },
            },
          });
        }

        // Handle user speech transcription
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
          const transcript = (event as any).transcript as string;
          if (transcript) {
            console.log('[WebRTC Hook] User transcript:', transcript);
            addMessage({ role: 'user', content: transcript });
          }
        }

        // Handle assistant response text
        if (event.type === 'response.audio_transcript.done') {
          const transcript = (event as any).transcript as string;
          if (transcript) {
            console.log('[WebRTC Hook] Assistant transcript:', transcript);
            addMessage({ role: 'assistant', content: transcript });
          }
        }

        // Handle errors from OpenAI
        if (event.type === 'error') {
          const errorMsg = (event as any).error?.message || 'Unknown OpenAI error';
          console.error('[WebRTC Hook] OpenAI error:', errorMsg);
          setError(errorMsg);
        }
      });

      // Initiate the call with the local stream (microphone) if provided
      await client.createCall('/api/openai-call', localStream);
      console.log('[WebRTC Hook] Handshake completed');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to OpenAI via WebRTC';
      console.error('[WebRTC Hook] Connection error:', err);
      setError(errorMessage);
      setStoreError(errorMessage);
      setSessionState('error');
      setIsConnecting(false);
      clientRef.current = null;
    }
  }, [setOpenaiConnected, setSessionState, setStoreError, addMessage]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.close();
      clientRef.current = null;
    }
    setIsConnected(false);
    setRemoteAudioStream(null);
    setOpenaiConnected(false);
    setSessionState('idle');
  }, [setOpenaiConnected, setSessionState]);

  const addMicrophoneTrack = useCallback((track: MediaStreamTrack, stream: MediaStream) => {
    if (clientRef.current) {
      clientRef.current.addTrack(track, stream);
      console.log('[WebRTC Hook] Microphone track added');
    } else {
      console.error('[WebRTC Hook] Cannot add track: client not initialized');
    }
  }, []);

  const sendMessage = useCallback((event: RealtimeEvent) => {
    if (clientRef.current) {
      clientRef.current.sendMessage(event);
    } else {
      console.error('[WebRTC Hook] Cannot send message: client not initialized');
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect,
    addMicrophoneTrack,
    sendMessage,
    remoteAudioStream,
  };
}