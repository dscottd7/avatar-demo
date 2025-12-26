import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHeygenSession } from '../useHeygenSession';
import { useAppStore } from '@/lib/stores/useAppStore';

// Mock the LiveAvatarSession SDK
const createMockSession = () => ({
  on: vi.fn(),
  off: vi.fn(),
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  repeat: vi.fn(),
  message: vi.fn(),
  interrupt: vi.fn(),
  attach: vi.fn(),
  keepAlive: vi.fn().mockResolvedValue(undefined),
  state: 'INACTIVE',
  maxSessionDuration: null,
});

let mockSession = createMockSession();

vi.mock('@heygen/liveavatar-web-sdk', () => ({
  LiveAvatarSession: vi.fn(() => mockSession),
  SessionEvent: {
    SESSION_STATE_CHANGED: 'session.state_changed',
    SESSION_STREAM_READY: 'session.stream_ready',
    SESSION_CONNECTION_QUALITY_CHANGED: 'session.connection_quality_changed',
    SESSION_DISCONNECTED: 'session.disconnected',
  },
  AgentEventsEnum: {
    AVATAR_SPEAK_STARTED: 'avatar.speak_started',
    AVATAR_SPEAK_ENDED: 'avatar.speak_ended',
    USER_SPEAK_STARTED: 'user.speak_started',
    USER_SPEAK_ENDED: 'user.speak_ended',
  },
  SessionState: {
    INACTIVE: 'INACTIVE',
    CONNECTING: 'CONNECTING',
    CONNECTED: 'CONNECTED',
    DISCONNECTING: 'DISCONNECTING',
    DISCONNECTED: 'DISCONNECTED',
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('useHeygenSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = createMockSession();

    act(() => {
      useAppStore.getState().resetSession();
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          session_id: 'test-session-id',
          session_token: 'test-token',
        },
      }),
    });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useHeygenSession());

    expect(result.current.session).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.mediaStream).toBeNull();
  });

  it('exposes session control functions', () => {
    const { result } = renderHook(() => useHeygenSession());

    expect(typeof result.current.startSession).toBe('function');
    expect(typeof result.current.stopSession).toBe('function');
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.interrupt).toBe('function');
  });

  it('fetches session token from API route on startSession', async () => {
    const { result } = renderHook(() => useHeygenSession());

    await act(async () => {
      await result.current.startSession();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/start-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('sets up event listeners when session starts', async () => {
    const { result } = renderHook(() => useHeygenSession());

    await act(async () => {
      await result.current.startSession();
    });

    expect(mockSession.on).toHaveBeenCalledWith('session.state_changed', expect.any(Function));
    expect(mockSession.on).toHaveBeenCalledWith('session.stream_ready', expect.any(Function));
    expect(mockSession.on).toHaveBeenCalledWith('avatar.speak_started', expect.any(Function));
    expect(mockSession.on).toHaveBeenCalledWith('avatar.speak_ended', expect.any(Function));
    expect(mockSession.on).toHaveBeenCalledWith('session.disconnected', expect.any(Function));
  });

  it('updates store with session ID', async () => {
    const { result } = renderHook(() => useHeygenSession());

    await act(async () => {
      await result.current.startSession();
    });

    const storeState = useAppStore.getState();
    expect(storeState.heygenSessionId).toBe('test-session-id');
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    });

    const { result } = renderHook(() => useHeygenSession());

    await act(async () => {
      await result.current.startSession();
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('Failed to start session');
  });

  it('calls repeat with text parameter', async () => {
    const { result } = renderHook(() => useHeygenSession());

    await act(async () => {
      await result.current.startSession();
    });

    act(() => {
      result.current.speak('Hello world');
    });

    expect(mockSession.repeat).toHaveBeenCalledWith('Hello world');
  });

  it('throws error when speaking without initialized session', () => {
    const { result } = renderHook(() => useHeygenSession());

    expect(() => result.current.speak('Hello')).toThrow('LiveAvatar session not initialized');
  });

  it('calls interrupt on the session', async () => {
    const { result } = renderHook(() => useHeygenSession());

    await act(async () => {
      await result.current.startSession();
    });

    act(() => {
      result.current.interrupt();
    });

    expect(mockSession.interrupt).toHaveBeenCalled();
  });

  it('handles interrupt when session not started', () => {
    const { result } = renderHook(() => useHeygenSession());

    // Should not throw, just do nothing
    act(() => {
      result.current.interrupt();
    });

    expect(mockSession.interrupt).not.toHaveBeenCalled();
  });
});
