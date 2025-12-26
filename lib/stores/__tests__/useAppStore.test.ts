import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.resetSession();
    });
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.heygenSessionId).toBeNull();
      expect(result.current.heygenConnected).toBe(false);
      expect(result.current.openaiConnected).toBe(false);
      expect(result.current.sessionActive).toBe(false);
      expect(result.current.sessionState).toBe('idle');
      expect(result.current.isMuted).toBe(false);
      expect(result.current.isUserTalking).toBe(false);
      expect(result.current.isAvatarSpeaking).toBe(false);
      expect(result.current.messages).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Session Actions', () => {
    it('should set HeyGen session ID', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setHeygenSession('test-session-123');
      });

      expect(result.current.heygenSessionId).toBe('test-session-123');
    });

    it('should set HeyGen connected status', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setHeygenConnected(true);
      });

      expect(result.current.heygenConnected).toBe(true);
    });

    it('should set OpenAI connected status', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setOpenaiConnected(true);
      });

      expect(result.current.openaiConnected).toBe(true);
    });

    it('should set session active status', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSessionActive(true);
      });

      expect(result.current.sessionActive).toBe(true);
    });

    it('should set session state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSessionState('connecting');
      });

      expect(result.current.sessionState).toBe('connecting');
    });
  });

  describe('Audio Actions', () => {
    it('should toggle mute state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setMuted(true);
      });

      expect(result.current.isMuted).toBe(true);

      act(() => {
        result.current.setMuted(false);
      });

      expect(result.current.isMuted).toBe(false);
    });

    it('should set user talking state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setUserTalking(true);
      });

      expect(result.current.isUserTalking).toBe(true);
    });

    it('should set avatar speaking state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAvatarSpeaking(true);
      });

      expect(result.current.isAvatarSpeaking).toBe(true);
    });
  });

  describe('Message Actions', () => {
    it('should add a message with generated id and timestamp', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addMessage({
          role: 'user',
          content: 'Hello, Kai!',
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello, Kai!');
      expect(result.current.messages[0].id).toBeDefined();
      expect(result.current.messages[0].timestamp).toBeInstanceOf(Date);
    });

    it('should add multiple messages in order', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addMessage({ role: 'user', content: 'Hello' });
        result.current.addMessage({ role: 'assistant', content: 'Hi there!' });
        result.current.addMessage({ role: 'user', content: 'How are you?' });
      });

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.messages[1].content).toBe('Hi there!');
      expect(result.current.messages[2].content).toBe('How are you?');
    });

    it('should clear all messages', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addMessage({ role: 'user', content: 'Test 1' });
        result.current.addMessage({ role: 'assistant', content: 'Test 2' });
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe('Error Actions', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setError('Connection failed');
      });

      expect(result.current.error).toBe('Connection failed');
    });

    it('should clear error message', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Reset Session', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useAppStore());

      // Set various states
      act(() => {
        result.current.setHeygenSession('test-123');
        result.current.setHeygenConnected(true);
        result.current.setOpenaiConnected(true);
        result.current.setSessionActive(true);
        result.current.setSessionState('connected');
        result.current.setMuted(true);
        result.current.setUserTalking(true);
        result.current.setAvatarSpeaking(true);
        result.current.addMessage({ role: 'user', content: 'Test' });
        result.current.setError('Test error');
      });

      // Reset
      act(() => {
        result.current.resetSession();
      });

      // Verify all states are reset
      expect(result.current.heygenSessionId).toBeNull();
      expect(result.current.heygenConnected).toBe(false);
      expect(result.current.openaiConnected).toBe(false);
      expect(result.current.sessionActive).toBe(false);
      expect(result.current.sessionState).toBe('idle');
      expect(result.current.isMuted).toBe(false);
      expect(result.current.isUserTalking).toBe(false);
      expect(result.current.isAvatarSpeaking).toBe(false);
      expect(result.current.messages).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });
});
