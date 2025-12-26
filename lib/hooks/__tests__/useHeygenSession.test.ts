import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHeygenSession } from '../useHeygenSession';
import { useAppStore } from '@/lib/stores/useAppStore';

// Mock the StreamingAvatar SDK
const createMockAvatar = () => ({
  on: vi.fn(),
  off: vi.fn(),
  createStartAvatar: vi.fn().mockResolvedValue(undefined),
  stopAvatar: vi.fn().mockResolvedValue(undefined),
  speak: vi.fn().mockResolvedValue(undefined),
  interrupt: vi.fn(),
});

let mockAvatar = createMockAvatar();

vi.mock('@heygen/streaming-avatar', () => ({
  default: vi.fn(() => mockAvatar),
  AvatarQuality: {
    High: 'high',
  },
  StreamingEvents: {
    AVATAR_START_TALKING: 'avatar_start_talking',
    AVATAR_STOP_TALKING: 'avatar_stop_talking',
    STREAM_READY: 'stream_ready',
    STREAM_DISCONNECTED: 'stream_disconnected',
  },
  TaskType: {
    REPEAT: 'repeat',
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('useHeygenSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAvatar = createMockAvatar();

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

    expect(result.current.avatar).toBeNull();
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

    expect(mockAvatar.on).toHaveBeenCalledWith('avatar_start_talking', expect.any(Function));
    expect(mockAvatar.on).toHaveBeenCalledWith('avatar_stop_talking', expect.any(Function));
    expect(mockAvatar.on).toHaveBeenCalledWith('stream_ready', expect.any(Function));
    expect(mockAvatar.on).toHaveBeenCalledWith('stream_disconnected', expect.any(Function));
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

  it('calls speak with correct parameters', async () => {
    const { result } = renderHook(() => useHeygenSession());

    await act(async () => {
      await result.current.startSession();
    });

    await act(async () => {
      await result.current.speak('Hello world');
    });

    expect(mockAvatar.speak).toHaveBeenCalledWith({
      text: 'Hello world',
      taskType: 'repeat',
    });
  });

  it('throws error when speaking without initialized session', async () => {
    const { result } = renderHook(() => useHeygenSession());

    await expect(result.current.speak('Hello')).rejects.toThrow('Avatar session not initialized');
  });

  it('calls interrupt on the avatar', async () => {
    const { result } = renderHook(() => useHeygenSession());

    await act(async () => {
      await result.current.startSession();
    });

    act(() => {
      result.current.interrupt();
    });

    expect(mockAvatar.interrupt).toHaveBeenCalled();
  });

  it('handles interrupt when session not started', () => {
    const { result } = renderHook(() => useHeygenSession());

    // Should not throw, just do nothing
    act(() => {
      result.current.interrupt();
    });

    expect(mockAvatar.interrupt).not.toHaveBeenCalled();
  });
});
