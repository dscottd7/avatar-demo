/**
 * Tests for useOpenAIWebRTC Hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOpenAIWebRTC } from '../useOpenAIWebRTC';

// Mock MediaStream (not available in Node.js)
class MockMediaStream {
  private tracks: MediaStreamTrack[] = [];

  constructor(tracks?: MediaStreamTrack[]) {
    if (tracks) {
      this.tracks = tracks;
    }
  }

  getTracks() {
    return this.tracks;
  }

  addTrack(track: MediaStreamTrack) {
    this.tracks.push(track);
  }
}

globalThis.MediaStream = MockMediaStream as any;

// Mock the WebRTC client
vi.mock('@/lib/openai/webrtc', () => ({
  OpenAIWebRTCClient: vi.fn().mockImplementation(() => ({
    createCall: vi.fn().mockResolvedValue('mock-sdp-answer'),
    addTrack: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
  })),
}));

// Mock the app store
const mockSetOpenaiConnected = vi.fn();
const mockSetSessionState = vi.fn();
const mockSetError = vi.fn();

vi.mock('@/lib/stores/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      setOpenaiConnected: mockSetOpenaiConnected,
      setSessionState: mockSetSessionState,
      setError: mockSetError,
    };
    return selector(state);
  }),
}));

describe('useOpenAIWebRTC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with isConnecting false', () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      expect(result.current.isConnecting).toBe(false);
    });

    it('should start with isConnected false', () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      expect(result.current.isConnected).toBe(false);
    });

    it('should start with error as null', () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      expect(result.current.error).toBeNull();
    });

    it('should start with remoteAudioStream as null', () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      expect(result.current.remoteAudioStream).toBeNull();
    });
  });

  describe('connect', () => {
    it('should set isConnecting to true when connecting', async () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      // Start connecting but don't await
      act(() => {
        result.current.connect();
      });

      expect(result.current.isConnecting).toBe(true);
    });

    it('should clear previous errors when connecting', async () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        await result.current.connect();
      });

      expect(mockSetError).toHaveBeenCalledWith(null);
    });

    it('should set session state to connecting', async () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        await result.current.connect();
      });

      expect(mockSetSessionState).toHaveBeenCalledWith('connecting');
    });

    it('should not create a new client if already connected', async () => {
      const { OpenAIWebRTCClient } = await import('@/lib/openai/webrtc');

      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        await result.current.connect();
      });

      const callCount = (OpenAIWebRTCClient as ReturnType<typeof vi.fn>).mock.calls.length;

      await act(async () => {
        await result.current.connect();
      });

      // Should not have created another client
      expect((OpenAIWebRTCClient as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });
  });

  describe('disconnect', () => {
    it('should set isConnected to false', async () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
    });

    it('should call setOpenaiConnected with false', async () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockSetOpenaiConnected).toHaveBeenCalledWith(false);
    });

    it('should set session state to idle', async () => {
      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockSetSessionState).toHaveBeenCalledWith('idle');
    });
  });

  describe('addMicrophoneTrack', () => {
    it('should not throw when client is not initialized', () => {
      const { result } = renderHook(() => useOpenAIWebRTC());
      const mockTrack = { kind: 'audio' } as MediaStreamTrack;
      const mockStream = new MediaStream();

      expect(() => {
        result.current.addMicrophoneTrack(mockTrack, mockStream);
      }).not.toThrow();
    });

    it('should add track to client when connected', async () => {
      const { OpenAIWebRTCClient } = await import('@/lib/openai/webrtc');
      const mockAddTrack = vi.fn();
      (OpenAIWebRTCClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        createCall: vi.fn().mockResolvedValue('mock-sdp-answer'),
        addTrack: mockAddTrack,
        close: vi.fn(),
        on: vi.fn(),
      }));

      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        await result.current.connect();
      });

      const mockTrack = { kind: 'audio' } as MediaStreamTrack;
      const mockStream = new MediaStream();

      act(() => {
        result.current.addMicrophoneTrack(mockTrack, mockStream);
      });

      expect(mockAddTrack).toHaveBeenCalledWith(mockTrack, mockStream);
    });
  });

  describe('cleanup', () => {
    it('should disconnect on unmount', async () => {
      const { OpenAIWebRTCClient } = await import('@/lib/openai/webrtc');
      const mockClose = vi.fn();
      (OpenAIWebRTCClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        createCall: vi.fn().mockResolvedValue('mock-sdp-answer'),
        addTrack: vi.fn(),
        close: mockClose,
        on: vi.fn(),
      }));

      const { result, unmount } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        await result.current.connect();
      });

      unmount();

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should set error state on connection failure', async () => {
      const { OpenAIWebRTCClient } = await import('@/lib/openai/webrtc');
      (OpenAIWebRTCClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        createCall: vi.fn().mockRejectedValue(new Error('Connection failed')),
        addTrack: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }));

      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        try {
          await result.current.connect();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Connection failed');
    });

    it('should set session state to error on failure', async () => {
      const { OpenAIWebRTCClient } = await import('@/lib/openai/webrtc');
      (OpenAIWebRTCClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        createCall: vi.fn().mockRejectedValue(new Error('Connection failed')),
        addTrack: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }));

      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        try {
          await result.current.connect();
        } catch {
          // Expected to throw
        }
      });

      expect(mockSetSessionState).toHaveBeenCalledWith('error');
    });

    it('should set isConnecting to false on error', async () => {
      const { OpenAIWebRTCClient } = await import('@/lib/openai/webrtc');
      (OpenAIWebRTCClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        createCall: vi.fn().mockRejectedValue(new Error('Connection failed')),
        addTrack: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }));

      const { result } = renderHook(() => useOpenAIWebRTC());

      await act(async () => {
        try {
          await result.current.connect();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isConnecting).toBe(false);
    });
  });
});
