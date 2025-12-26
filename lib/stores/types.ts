// Store Types

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type SessionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface AppState {
  // Session states
  heygenSessionId: string | null;
  heygenConnected: boolean;
  openaiConnected: boolean;
  sessionActive: boolean;
  sessionState: SessionState;

  // Audio states
  isMuted: boolean;
  isUserTalking: boolean;
  isAvatarSpeaking: boolean;

  // Conversation
  messages: Message[];

  // Error state
  error: string | null;

  // Actions
  setHeygenSession: (sessionId: string) => void;
  setHeygenConnected: (connected: boolean) => void;
  setOpenaiConnected: (connected: boolean) => void;
  setSessionActive: (active: boolean) => void;
  setSessionState: (state: SessionState) => void;
  setMuted: (muted: boolean) => void;
  setUserTalking: (talking: boolean) => void;
  setAvatarSpeaking: (speaking: boolean) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  resetSession: () => void;
}
