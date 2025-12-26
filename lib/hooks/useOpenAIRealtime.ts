/**
 * useOpenAIRealtime Hook
 * Manages OpenAI Realtime API connection and conversation flow
 *
 * ⚠️ SECURITY NOTE: This implementation uses client-side API key
 * for rapid prototyping. NOT suitable for production.
 * See Phase 6 for secure token-based approach.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { OpenAIRealtimeClient } from '@/lib/openai/realtime';
import { ServerEventType, SessionConfig } from '@/lib/openai/types';
import { useAppStore } from '@/lib/stores/useAppStore';
import { avatarConfig } from '@/config/avatar.config';

interface UseOpenAIRealtimeConfig {
  apiKey: string;
  onAudioResponse?: (audioBase64: string) => void;
  onTranscriptUpdate?: (transcript: string, isUser: boolean) => void;
}

interface UseOpenAIRealtimeReturn {
  client: OpenAIRealtimeClient | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudio: (audioBase64: string) => void;
  currentTranscript: string;
}

export function useOpenAIRealtime(config: UseOpenAIRealtimeConfig): UseOpenAIRealtimeReturn {
  const clientRef = useRef<OpenAIRealtimeClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const setOpenaiConnected = useAppStore((state) => state.setOpenaiConnected);
  const setSessionState = useAppStore((state) => state.setSessionState);
  const addMessage = useAppStore((state) => state.addMessage);
  const setStoreError = useAppStore((state) => state.setError);
  const setUserTalking = useAppStore((state) => state.setUserTalking);

  // Accumulated audio chunks for the current response
  const audioChunksRef = useRef<string[]>([]);
  const userTranscriptRef = useRef('');
  const assistantTranscriptRef = useRef('');

  const connect = useCallback(async () => {
    if (clientRef.current?.isConnected()) {
      console.log('[OpenAI Hook] Already connected');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setStoreError(null);

      console.log('[OpenAI Hook] Initializing OpenAI Realtime client...');

      // Create session configuration based on avatar config
      const sessionConfig: Partial<SessionConfig> = {
        type: 'session', // Required by OpenAI Realtime API
        modalities: ['text', 'audio'],
        instructions: avatarConfig.instructions || 'You are a helpful AI assistant.',
        voice: avatarConfig.voice as 'alloy' | 'echo' | 'shimmer' || 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        temperature: 0.8,
      };

      const client = new OpenAIRealtimeClient({
        apiKey: config.apiKey,
        sessionConfig,
        onOpen: () => {
          console.log('[OpenAI Hook] Connection established');
          setIsConnected(true);
          setIsConnecting(false);
          setOpenaiConnected(true);
          setSessionState('connected');
        },
        onClose: () => {
          console.log('[OpenAI Hook] Connection closed');
          setIsConnected(false);
          setOpenaiConnected(false);
        },
        onError: (err) => {
          console.error('[OpenAI Hook] Connection error:', err);
          setError(err.message);
          setStoreError(err.message);
          setIsConnecting(false);
        },
      });

      // Set up event handlers
      setupEventHandlers(client);

      clientRef.current = client;
      await client.connect();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to OpenAI';
      console.error('[OpenAI Hook] Connection error:', err);
      setError(errorMessage);
      setStoreError(errorMessage);
      setIsConnecting(false);
    }
  }, [config.apiKey, setOpenaiConnected, setSessionState, setStoreError]);

  const setupEventHandlers = useCallback((client: OpenAIRealtimeClient) => {
    // Handle user speech detection
    client.on(ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED, () => {
      console.log('[OpenAI Hook] User started speaking');
      setUserTalking(true);
      userTranscriptRef.current = '';
    });

    client.on(ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED, () => {
      console.log('[OpenAI Hook] User stopped speaking');
      setUserTalking(false);
    });

    // Handle transcription of user input
    client.on(ServerEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED, (event: any) => {
      const transcript = event.transcript || '';
      console.log('[OpenAI Hook] User transcript:', transcript);
      userTranscriptRef.current = transcript;
      setCurrentTranscript(transcript);

      // Add user message to chat history
      addMessage({
        role: 'user',
        content: transcript,
      });

      // Notify parent component
      config.onTranscriptUpdate?.(transcript, true);
    });

    // Handle audio response chunks
    client.on(ServerEventType.RESPONSE_AUDIO_DELTA, (event: any) => {
      const audioDelta = event.delta;
      if (audioDelta) {
        audioChunksRef.current.push(audioDelta);
      }
    });

    // Handle transcript of AI response
    client.on(ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA, (event: any) => {
      const delta = event.delta || '';
      assistantTranscriptRef.current += delta;
      setCurrentTranscript(assistantTranscriptRef.current);
    });

    // Handle response completion
    client.on(ServerEventType.RESPONSE_DONE, (event: any) => {
      console.log('[OpenAI Hook] Response completed');

      // Get full transcript
      const fullTranscript = assistantTranscriptRef.current;
      console.log('[OpenAI Hook] Assistant transcript:', fullTranscript);

      // Add assistant message to chat history
      if (fullTranscript) {
        addMessage({
          role: 'assistant',
          content: fullTranscript,
        });

        // Notify parent component
        config.onTranscriptUpdate?.(fullTranscript, false);
      }

      // Send accumulated audio to HeyGen (if callback provided)
      if (audioChunksRef.current.length > 0 && config.onAudioResponse) {
        // Concatenate all audio chunks
        const fullAudio = audioChunksRef.current.join('');
        config.onAudioResponse(fullAudio);
      }

      // Reset for next response
      audioChunksRef.current = [];
      assistantTranscriptRef.current = '';
      setCurrentTranscript('');
    });

    // Handle errors
    client.on(ServerEventType.ERROR, (event: any) => {
      const errorMsg = event.error?.message || 'Unknown OpenAI error';
      const errorDetails = event.error ? {
        type: event.error.type,
        code: event.error.code,
        message: event.error.message,
      } : event;

      console.error('[OpenAI Hook] Server error:', errorDetails);
      setError(errorMsg);
      setStoreError(errorMsg);
    });
  }, [addMessage, config, setUserTalking, setStoreError]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
      setIsConnected(false);
      setOpenaiConnected(false);
    }
  }, [setOpenaiConnected]);

  const sendAudio = useCallback((audioBase64: string) => {
    if (!clientRef.current?.isConnected()) {
      console.warn('[OpenAI Hook] Cannot send audio: not connected');
      return;
    }

    clientRef.current.sendAudio(audioBase64);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  return {
    client: clientRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendAudio,
    currentTranscript,
  };
}
