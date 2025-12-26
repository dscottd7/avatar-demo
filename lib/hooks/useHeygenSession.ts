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
  attachVideo: (videoElement: HTMLVideoElement) => void;
  isStreamReady: boolean;
}

export function useHeygenSession(): UseHeygenSessionReturn {
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);

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

      // Check for and cleanup any orphaned session from localStorage
      const orphanedSessionId = localStorage.getItem('liveavatar_session_id');
      if (orphanedSessionId) {
        console.log('[LiveAvatar] Found orphaned session, cleaning up:', orphanedSessionId);
        await fetch('/api/stop-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: orphanedSessionId }),
        }).catch(err => console.error('[LiveAvatar] Failed to cleanup orphaned session:', err));
        localStorage.removeItem('liveavatar_session_id');
      }

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
            setIsStreamReady(false);
            break;
          case SessionState.CONNECTING:
            setSessionState('connecting');
            break;
        }
      });

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        console.log('[LiveAvatar] Stream ready');
        setIsStreamReady(true);

        // If a video element has already been attached, attach the stream to it
        if (videoElementRef.current) {
          console.log('[LiveAvatar] Attaching stream to video element');
          session.attach(videoElementRef.current);
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
        setIsStreamReady(false);
      });

      // Start the session
      await session.start();

      // Store session ID for cleanup (both in ref and localStorage)
      sessionIdRef.current = sessionData.session_id;
      localStorage.setItem('liveavatar_session_id', sessionData.session_id);
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
      const sessionId = sessionIdRef.current;

      // Stop the SDK session first
      if (sessionRef.current) {
        await sessionRef.current.stop();
        sessionRef.current = null;
        videoElementRef.current = null;
        setIsStreamReady(false);
        console.log('[LiveAvatar] Client session stopped');
      }

      // Call backend API to stop the server-side session
      if (sessionId) {
        console.log('[LiveAvatar] Stopping server session:', sessionId);
        const response = await fetch('/api/stop-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          console.error('[LiveAvatar] Failed to stop server session:', response.statusText);
        } else {
          console.log('[LiveAvatar] Server session stopped successfully');
        }

        sessionIdRef.current = null;
        localStorage.removeItem('liveavatar_session_id');
      }

      setHeygenConnected(false);
      setSessionState('idle');
      setHeygenSession(null);
    } catch (err) {
      console.error('[LiveAvatar] Error stopping session:', err);
    }
  }, [setHeygenConnected, setSessionState, setHeygenSession]);

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

  const attachVideo = useCallback((videoElement: HTMLVideoElement) => {
    videoElementRef.current = videoElement;
    console.log('[LiveAvatar] Video element registered');

    // If stream is already ready, attach immediately
    if (sessionRef.current && isStreamReady) {
      console.log('[LiveAvatar] Stream already ready, attaching to video');
      sessionRef.current.attach(videoElement);
    }
  }, [isStreamReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop().catch(console.error);
      }

      // Also call backend API to stop server session
      if (sessionIdRef.current) {
        fetch('/api/stop-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionIdRef.current }),
          keepalive: true, // Ensures request completes even if page is closing
        }).catch(console.error);
      }
    };
  }, []);

  // Cleanup on page unload (browser close, refresh, navigation)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        // Use sendBeacon for reliable cleanup during page unload
        const blob = new Blob(
          [JSON.stringify({ session_id: sessionId })],
          { type: 'application/json' }
        );
        navigator.sendBeacon('/api/stop-session', blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    session: sessionRef.current,
    isConnecting,
    error,
    startSession,
    stopSession,
    speak,
    interrupt,
    attachVideo,
    isStreamReady,
  };
}
