import { useEffect, useRef, useState, useCallback } from 'react';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from '@heygen/streaming-avatar';
import { useAppStore } from '@/lib/stores/useAppStore';
import { createHeyGenSession } from '@/lib/heygen/session';
import { avatarConfig } from '@/config/avatar.config';

interface UseHeygenSessionReturn {
  avatar: StreamingAvatar | null;
  isConnecting: boolean;
  error: string | null;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  speak: (text: string) => Promise<void>;
  interrupt: () => void;
  mediaStream: MediaStream | null;
}

export function useHeygenSession(): UseHeygenSessionReturn {
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const setHeygenSession = useAppStore((state) => state.setHeygenSession);
  const setHeygenConnected = useAppStore((state) => state.setHeygenConnected);
  const setAvatarSpeaking = useAppStore((state) => state.setAvatarSpeaking);
  const setSessionState = useAppStore((state) => state.setSessionState);
  const setStoreError = useAppStore((state) => state.setError);

  const startSession = useCallback(async () => {
    try {
      setIsConnecting(true);
      setSessionState('connecting');
      setError(null);
      setStoreError(null);

      // Get session token from backend
      const sessionData = await createHeyGenSession(avatarConfig.avatarId);

      // Initialize StreamingAvatar with token
      const avatar = new StreamingAvatar({ token: sessionData.session_token });
      avatarRef.current = avatar;

      // Set up event listeners
      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('[HeyGen] Avatar started talking');
        setAvatarSpeaking(true);
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('[HeyGen] Avatar stopped talking');
        setAvatarSpeaking(false);
      });

      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('[HeyGen] Stream ready', event);
        setHeygenConnected(true);
        setSessionState('connected');

        // Get media stream from event
        if (event && event.detail && event.detail.stream) {
          setMediaStream(event.detail.stream);
        }
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('[HeyGen] Stream disconnected');
        setHeygenConnected(false);
        setSessionState('disconnected');
        setMediaStream(null);
      });

      // Start avatar session
      await avatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: avatarConfig.avatarId,
        language: avatarConfig.language,
        voice: {
          voiceId: avatarConfig.openai.voice,
        },
      });

      setHeygenSession(sessionData.session_id);
      setIsConnecting(false);

      console.log('[HeyGen] Session started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start HeyGen session';
      console.error('[HeyGen] Session error:', err);
      setError(errorMessage);
      setStoreError(errorMessage);
      setSessionState('error');
      setIsConnecting(false);
    }
  }, [setHeygenSession, setHeygenConnected, setAvatarSpeaking, setSessionState, setStoreError]);

  const stopSession = useCallback(async () => {
    try {
      if (avatarRef.current) {
        await avatarRef.current.stopAvatar();
        avatarRef.current = null;
        setMediaStream(null);
        setHeygenConnected(false);
        setSessionState('idle');
        console.log('[HeyGen] Session stopped');
      }
    } catch (err) {
      console.error('[HeyGen] Error stopping session:', err);
    }
  }, [setHeygenConnected, setSessionState]);

  const speak = useCallback(async (text: string) => {
    if (!avatarRef.current) {
      throw new Error('Avatar session not initialized');
    }

    try {
      await avatarRef.current.speak({
        text,
        taskType: TaskType.REPEAT,
      });
      console.log('[HeyGen] Speak command sent:', text);
    } catch (err) {
      console.error('[HeyGen] Error sending speak command:', err);
      throw err;
    }
  }, []);

  const interrupt = useCallback(() => {
    if (avatarRef.current) {
      avatarRef.current.interrupt();
      console.log('[HeyGen] Interrupt sent');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarRef.current) {
        avatarRef.current.stopAvatar().catch(console.error);
      }
    };
  }, []);

  return {
    avatar: avatarRef.current,
    isConnecting,
    error,
    startSession,
    stopSession,
    speak,
    interrupt,
    mediaStream,
  };
}
