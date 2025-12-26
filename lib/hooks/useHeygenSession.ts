import { useEffect, useRef, useState, useCallback } from 'react';
import {
  LiveAvatarSession,
  SessionEvent,
  AgentEventsEnum,
  SessionState,
} from '@heygen/liveavatar-web-sdk';
import { useAppStore } from '@/lib/stores/useAppStore';
import { avatarConfig } from '@/config/avatar.config';

interface UseHeygenSessionReturn {
  session: LiveAvatarSession | null;
  isConnecting: boolean;
  error: string | null;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  speak: (text: string) => void;
  interrupt: () => void;
  mediaStream: MediaStream | null;
}

export function useHeygenSession(): UseHeygenSessionReturn {
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
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

      console.log('[LiveAvatar] Starting session...');

      // Get session token from backend API route
      const response = await fetch('/api/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }

      const { data: sessionData } = await response.json();
      console.log('[LiveAvatar] Received session token:', sessionData.session_id);

      // Initialize LiveAvatarSession with token
      const session = new LiveAvatarSession(sessionData.session_token);
      sessionRef.current = session;

      // Set up event listeners
      session.on(SessionEvent.SESSION_STATE_CHANGED, (state: SessionState) => {
        console.log('[LiveAvatar] Session state changed:', state);

        switch (state) {
          case SessionState.CONNECTED:
            setHeygenConnected(true);
            setSessionState('connected');
            setIsConnecting(false);
            break;
          case SessionState.DISCONNECTED:
            setHeygenConnected(false);
            setSessionState('disconnected');
            setMediaStream(null);
            break;
          case SessionState.CONNECTING:
            setSessionState('connecting');
            break;
        }
      });

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        console.log('[LiveAvatar] Stream ready');

        // Create a video element to attach the stream
        if (!videoElementRef.current) {
          videoElementRef.current = document.createElement('video');
          videoElementRef.current.autoplay = true;
          videoElementRef.current.playsInline = true;
        }

        // Attach the session to the video element
        session.attach(videoElementRef.current);

        // Get the media stream from the video element
        if (videoElementRef.current.srcObject instanceof MediaStream) {
          setMediaStream(videoElementRef.current.srcObject);
        }
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        console.log('[LiveAvatar] Avatar started speaking');
        setAvatarSpeaking(true);
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        console.log('[LiveAvatar] Avatar stopped speaking');
        setAvatarSpeaking(false);
      });

      session.on(SessionEvent.SESSION_DISCONNECTED, (reason) => {
        console.log('[LiveAvatar] Session disconnected:', reason);
        setHeygenConnected(false);
        setSessionState('disconnected');
        setMediaStream(null);
      });

      // Start the session
      await session.start();
      setHeygenSession(sessionData.session_id);

      console.log('[LiveAvatar] Session started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start LiveAvatar session';
      console.error('[LiveAvatar] Session error:', err);
      setError(errorMessage);
      setStoreError(errorMessage);
      setSessionState('error');
      setIsConnecting(false);
    }
  }, [setHeygenSession, setHeygenConnected, setAvatarSpeaking, setSessionState, setStoreError]);

  const stopSession = useCallback(async () => {
    try {
      if (sessionRef.current) {
        await sessionRef.current.stop();
        sessionRef.current = null;
        videoElementRef.current = null;
        setMediaStream(null);
        setHeygenConnected(false);
        setSessionState('idle');
        console.log('[LiveAvatar] Session stopped');
      }
    } catch (err) {
      console.error('[LiveAvatar] Error stopping session:', err);
    }
  }, [setHeygenConnected, setSessionState]);

  const speak = useCallback((text: string) => {
    if (!sessionRef.current) {
      throw new Error('LiveAvatar session not initialized');
    }

    try {
      // Use repeat() to make the avatar speak the text verbatim
      sessionRef.current.repeat(text);
      console.log('[LiveAvatar] Speak command sent:', text);
    } catch (err) {
      console.error('[LiveAvatar] Error sending speak command:', err);
      throw err;
    }
  }, []);

  const interrupt = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.interrupt();
      console.log('[LiveAvatar] Interrupt sent');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return {
    session: sessionRef.current,
    isConnecting,
    error,
    startSession,
    stopSession,
    speak,
    interrupt,
    mediaStream,
  };
}
