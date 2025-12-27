/**
 * Tests for OpenAI WebRTC Client
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIWebRTCClient } from '../webrtc';

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

// Mock RTCDataChannel
class MockRTCDataChannel {
  label: string;
  readyState: RTCDataChannelState = 'connecting';
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(label: string) {
    this.label = label;
  }

  send(data: string) {
    // Mock implementation
  }
}

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  localDescription: RTCSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  connectionState: RTCPeerConnectionState = 'new';
  iceGatheringState: RTCIceGatheringState = 'complete';
  onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null;
  ontrack: ((event: { track: MediaStreamTrack }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  onicegatheringstatechange: (() => void) | null = null;

  private transceivers: { kind: string; direction: string }[] = [];
  private tracks: { track: MediaStreamTrack; stream: MediaStream }[] = [];
  private dataChannels: MockRTCDataChannel[] = [];

  createDataChannel(label: string): MockRTCDataChannel {
    const channel = new MockRTCDataChannel(label);
    this.dataChannels.push(channel);
    return channel;
  }

  addTransceiver(kind: string, init?: RTCRtpTransceiverInit) {
    this.transceivers.push({ kind, direction: init?.direction || 'sendrecv' });
    return { kind, direction: init?.direction || 'sendrecv' };
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return { type: 'offer', sdp: 'mock-sdp-offer' };
  }

  async setLocalDescription(desc: RTCSessionDescriptionInit): Promise<void> {
    this.localDescription = desc;
  }

  async setRemoteDescription(desc: RTCSessionDescriptionInit): Promise<void> {
    this.remoteDescription = desc;
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    // Mock implementation
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    this.tracks.push({ track, stream });
  }

  close() {
    this.connectionState = 'closed';
    this.onconnectionstatechange?.();
  }

  // Helper to get added transceivers for testing
  getTransceivers() {
    return this.transceivers;
  }

  // Helper to get added tracks for testing
  getTracks() {
    return this.tracks;
  }

  // Helper to get created data channels for testing
  getDataChannels() {
    return this.dataChannels;
  }
}

// Mock RTCSessionDescription
class MockRTCSessionDescription {
  type: RTCSdpType;
  sdp: string;

  constructor(init: RTCSessionDescriptionInit) {
    this.type = init.type!;
    this.sdp = init.sdp!;
  }
}

// Store original globals
const originalRTCPeerConnection = globalThis.RTCPeerConnection;
const originalRTCSessionDescription = globalThis.RTCSessionDescription;
const originalFetch = globalThis.fetch;

describe('OpenAIWebRTCClient', () => {
  let mockPeerConnection: MockRTCPeerConnection;

  beforeEach(() => {
    mockPeerConnection = new MockRTCPeerConnection();

    // Mock RTCPeerConnection
    globalThis.RTCPeerConnection = vi.fn(() => mockPeerConnection) as any;

    // Mock RTCSessionDescription
    globalThis.RTCSessionDescription = MockRTCSessionDescription as any;

    // Reset fetch mock
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.RTCPeerConnection = originalRTCPeerConnection;
    globalThis.RTCSessionDescription = originalRTCSessionDescription;
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an RTCPeerConnection with STUN servers', () => {
      new OpenAIWebRTCClient();

      expect(RTCPeerConnection).toHaveBeenCalledWith({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
    });

    it('should set up event handlers on the peer connection', () => {
      new OpenAIWebRTCClient();

      expect(mockPeerConnection.onicecandidate).toBeDefined();
      expect(mockPeerConnection.ontrack).toBeDefined();
      expect(mockPeerConnection.onconnectionstatechange).toBeDefined();
    });

    it('should create oai-events data channel', () => {
      new OpenAIWebRTCClient();

      const dataChannels = mockPeerConnection.getDataChannels();
      expect(dataChannels).toHaveLength(1);
      expect(dataChannels[0].label).toBe('oai-events');
    });
  });

  describe('createCall', () => {
    it('should add an audio transceiver with sendrecv direction', async () => {
      const client = new OpenAIWebRTCClient();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { sdp: 'mock-answer-sdp' } }),
      });

      await client.createCall('/api/openai-call');

      const transceivers = mockPeerConnection.getTransceivers();
      expect(transceivers).toContainEqual({ kind: 'audio', direction: 'sendrecv' });
    });

    it('should create an SDP offer and set it as local description', async () => {
      const client = new OpenAIWebRTCClient();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { sdp: 'mock-answer-sdp' } }),
      });

      await client.createCall('/api/openai-call');

      expect(mockPeerConnection.localDescription).toEqual({
        type: 'offer',
        sdp: 'mock-sdp-offer',
      });
    });

    it('should send the SDP offer to the backend', async () => {
      const client = new OpenAIWebRTCClient();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { sdp: 'mock-answer-sdp' } }),
      });

      await client.createCall('/api/openai-call');

      expect(fetch).toHaveBeenCalledWith('/api/openai-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: 'mock-sdp-offer' }),
      });
    });

    it('should set the SDP answer as remote description', async () => {
      const client = new OpenAIWebRTCClient();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { sdp: 'mock-answer-sdp' } }),
      });

      await client.createCall('/api/openai-call');

      expect(mockPeerConnection.remoteDescription).toEqual({
        type: 'answer',
        sdp: 'mock-answer-sdp',
      });
    });

    it('should return the SDP answer', async () => {
      const client = new OpenAIWebRTCClient();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { sdp: 'mock-answer-sdp' } }),
      });

      const result = await client.createCall('/api/openai-call');

      expect(result).toBe('mock-answer-sdp');
    });

    it('should throw an error if backend returns failure', async () => {
      const client = new OpenAIWebRTCClient();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => ({ success: false, message: 'API key invalid' }),
      });

      await expect(client.createCall('/api/openai-call')).rejects.toThrow(
        'Failed to create OpenAI call: API key invalid'
      );
    });

    it('should throw an error if SDP answer is missing', async () => {
      const client = new OpenAIWebRTCClient();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      });

      await expect(client.createCall('/api/openai-call')).rejects.toThrow(
        'SDP answer was not found in the backend response.'
      );
    });
  });

  describe('addTrack', () => {
    it('should add a track to the peer connection', () => {
      const client = new OpenAIWebRTCClient();
      const mockTrack = { kind: 'audio' } as MediaStreamTrack;
      const mockStream = new MediaStream();

      client.addTrack(mockTrack, mockStream);

      const tracks = mockPeerConnection.getTracks();
      expect(tracks).toContainEqual({ track: mockTrack, stream: mockStream });
    });
  });

  describe('close', () => {
    it('should close the peer connection', () => {
      const client = new OpenAIWebRTCClient();

      client.close();

      expect(mockPeerConnection.connectionState).toBe('closed');
    });
  });

  describe('event emitting', () => {
    it('should emit icecandidate events', () => {
      const client = new OpenAIWebRTCClient();
      const handler = vi.fn();
      client.on('icecandidate', handler);

      const mockCandidate = { candidate: 'mock-candidate' } as RTCIceCandidate;
      mockPeerConnection.onicecandidate?.({ candidate: mockCandidate });

      expect(handler).toHaveBeenCalledWith(mockCandidate);
    });

    it('should emit track events', () => {
      const client = new OpenAIWebRTCClient();
      const handler = vi.fn();
      client.on('track', handler);

      const mockTrack = { kind: 'audio' } as MediaStreamTrack;
      mockPeerConnection.ontrack?.({ track: mockTrack } as any);

      expect(handler).toHaveBeenCalledWith(mockTrack);
    });

    it('should emit connectionstatechange events', () => {
      const client = new OpenAIWebRTCClient();
      const handler = vi.fn();
      client.on('connectionstatechange', handler);

      mockPeerConnection.connectionState = 'connected';
      mockPeerConnection.onconnectionstatechange?.();

      expect(handler).toHaveBeenCalledWith('connected');
    });

    it('should not emit icecandidate for null candidates', () => {
      const client = new OpenAIWebRTCClient();
      const handler = vi.fn();
      client.on('icecandidate', handler);

      mockPeerConnection.onicecandidate?.({ candidate: null });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should emit message events when data channel receives messages', () => {
      const client = new OpenAIWebRTCClient();
      const handler = vi.fn();
      client.on('message', handler);

      // Get the data channel and simulate a message
      const dataChannels = mockPeerConnection.getDataChannels();
      const channel = dataChannels[0];
      const mockEvent = new MessageEvent('message', {
        data: JSON.stringify({ type: 'session.created', session: {} }),
      });
      channel.onmessage?.(mockEvent);

      expect(handler).toHaveBeenCalledWith({ type: 'session.created', session: {} });
    });
  });

  describe('sendMessage', () => {
    it('should send message through data channel when open', () => {
      const client = new OpenAIWebRTCClient();
      const dataChannels = mockPeerConnection.getDataChannels();
      const channel = dataChannels[0];

      // Mock the channel as open
      channel.readyState = 'open';
      const sendSpy = vi.spyOn(channel, 'send');

      client.sendMessage({ type: 'session.update', session: { voice: 'alloy' } });

      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({ type: 'session.update', session: { voice: 'alloy' } }));
    });

    it('should not send message if data channel is not open', () => {
      const client = new OpenAIWebRTCClient();
      const dataChannels = mockPeerConnection.getDataChannels();
      const channel = dataChannels[0];

      // Channel is in connecting state by default
      const sendSpy = vi.spyOn(channel, 'send');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      client.sendMessage({ type: 'session.update' });

      expect(sendSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
