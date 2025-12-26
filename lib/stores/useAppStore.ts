import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import type { AppState, Message } from './types';

/**
 * Global application state store using Zustand
 * Manages session states, audio states, and conversation history
 */
export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Initial session states
      heygenSessionId: null,
      heygenConnected: false,
      openaiConnected: false,
      sessionActive: false,
      sessionState: 'idle',

      // Initial audio states
      isMuted: false,
      isUserTalking: false,
      isAvatarSpeaking: false,

      // Initial conversation state
      messages: [],

      // Initial error state
      error: null,

      // Session actions
      setHeygenSession: (sessionId: string) =>
        set({ heygenSessionId: sessionId }, false, 'setHeygenSession'),

      setHeygenConnected: (connected: boolean) =>
        set({ heygenConnected: connected }, false, 'setHeygenConnected'),

      setOpenaiConnected: (connected: boolean) =>
        set({ openaiConnected: connected }, false, 'setOpenaiConnected'),

      setSessionActive: (active: boolean) =>
        set({ sessionActive: active }, false, 'setSessionActive'),

      setSessionState: (state) =>
        set({ sessionState: state }, false, 'setSessionState'),

      // Audio actions
      setMuted: (muted: boolean) =>
        set({ isMuted: muted }, false, 'setMuted'),

      setUserTalking: (talking: boolean) =>
        set({ isUserTalking: talking }, false, 'setUserTalking'),

      setAvatarSpeaking: (speaking: boolean) =>
        set({ isAvatarSpeaking: speaking }, false, 'setAvatarSpeaking'),

      // Message actions
      addMessage: (message: Omit<Message, 'id' | 'timestamp'>) =>
        set(
          (state) => ({
            messages: [
              ...state.messages,
              {
                ...message,
                id: crypto.randomUUID(),
                timestamp: new Date(),
              },
            ],
          }),
          false,
          'addMessage'
        ),

      clearMessages: () => set({ messages: [] }, false, 'clearMessages'),

      // Error actions
      setError: (error: string | null) =>
        set({ error }, false, 'setError'),

      // Reset all session state
      resetSession: () =>
        set(
          {
            heygenSessionId: null,
            heygenConnected: false,
            openaiConnected: false,
            sessionActive: false,
            sessionState: 'idle',
            isMuted: false,
            isUserTalking: false,
            isAvatarSpeaking: false,
            messages: [],
            error: null,
          },
          false,
          'resetSession'
        ),
    }),
    {
      name: 'KaiAvatarStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selector hooks for optimized re-renders
export const useSessionState = () =>
  useAppStore(
    (state) => ({
      sessionId: state.heygenSessionId,
      heygenConnected: state.heygenConnected,
      openaiConnected: state.openaiConnected,
      sessionActive: state.sessionActive,
      sessionState: state.sessionState,
    }),
    shallow
  );

export const useAudioState = () =>
  useAppStore(
    (state) => ({
      isMuted: state.isMuted,
      isUserTalking: state.isUserTalking,
      isAvatarSpeaking: state.isAvatarSpeaking,
    }),
    shallow
  );

export const useMessages = () => useAppStore((state) => state.messages);

export const useError = () => useAppStore((state) => state.error);
