/**
 * OpenAI WebRTC Client
 * Manages the RTCPeerConnection and its lifecycle for interacting
 * with the OpenAI Realtime API via WebRTC.
 *
 * OpenAI sends events through a data channel including:
 * - Transcriptions of user speech
 * - AI response text
 * - Session events
 */

// Event types from OpenAI Realtime API
export interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

interface WebRTCClientEventMap {
  icecandidate: (candidate: RTCIceCandidate) => void;
  track: (track: MediaStreamTrack) => void;
  connectionstatechange: (state: RTCPeerConnectionState) => void;
  message: (event: RealtimeEvent) => void;
}

export class OpenAIWebRTCClient {
  private pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private eventListeners: {
    [K in keyof WebRTCClientEventMap]?: WebRTCClientEventMap[K][];
  } = {};

  constructor() {
    // Basic WebRTC configuration. For production, you might need TURN servers.
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('icecandidate', event.candidate);
      }
    };

    this.pc.ontrack = (event) => {
      console.log('[WebRTC] Received track:', event.track.kind);
      this.emit('track', event.track);
    };

    this.pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', this.pc.connectionState);
      this.emit('connectionstatechange', this.pc.connectionState);
    };

    // Create the data channel for OpenAI events (must be created by offerer before offer)
    // OpenAI expects this channel to be named "oai-events"
    console.log('[WebRTC] Creating oai-events data channel...');
    const channel = this.pc.createDataChannel('oai-events');
    this.setupDataChannel(channel);
  }

  /**
   * Set up event handlers for a data channel
   */
  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
    console.log('[WebRTC] Setting up data channel:', channel.label, 'state:', channel.readyState);

    channel.onopen = () => {
      console.log('[WebRTC] Data channel opened:', channel.label);
    };

    channel.onclose = () => {
      console.log('[WebRTC] Data channel closed:', channel.label);
    };

    channel.onerror = (event) => {
      console.error('[WebRTC] Data channel error:', event);
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as RealtimeEvent;
        console.log('[WebRTC] Received message:', message.type, message);
        this.emit('message', message);
      } catch (err) {
        console.error('[WebRTC] Failed to parse message:', err, 'raw data:', event.data);
      }
    };
  }

  /**
   * Send a message through the data channel
   */
  public sendMessage(event: RealtimeEvent): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('[WebRTC] Cannot send message: data channel not open');
      return;
    }
    this.dataChannel.send(JSON.stringify(event));
  }

  /**
   * Initiates the WebRTC call by creating an offer and sending it to the backend.
   * @param backendUrl The URL of our backend API route (e.g., '/api/openai-call').
   * @param localStream Optional local MediaStream to add before creating the offer.
   * @returns The SDP answer received from the backend.
   */
  public async createCall(backendUrl: string, localStream?: MediaStream): Promise<string> {
    // If a local stream is provided, add its tracks before creating the offer
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log(`[WebRTC] Adding local track: ${track.kind}`);
        this.pc.addTrack(track, localStream);
      });
    } else {
      // Add transceivers to specify what we want to send and receive.
      // This is needed when no local stream is provided upfront.
      console.log('[WebRTC] No local stream provided, adding audio transceiver...');
      this.pc.addTransceiver('audio', { direction: 'sendrecv' });
    }

    console.log('[WebRTC] Creating SDP offer...');
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    console.log('[WebRTC] Local description set');

    // Wait for ICE gathering to complete (or timeout after 2 seconds)
    await this.waitForIceGathering();

    const finalOffer = this.pc.localDescription;
    if (!finalOffer?.sdp) {
      throw new Error('Failed to get local SDP offer');
    }

    console.log('[WebRTC] Sending SDP offer to backend...');
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sdp: finalOffer.sdp }),
    });

    const responseData = await response.json();

    if (!responseData.success) {
      throw new Error(`Failed to create OpenAI call: ${responseData.message}`);
    }

    const sdpAnswer = responseData.data.sdp;
    if (!sdpAnswer) {
      throw new Error('SDP answer was not found in the backend response.');
    }

    console.log('[WebRTC] Received SDP answer, setting remote description...');
    await this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sdpAnswer }));
    console.log('[WebRTC] Remote description set, connection state:', this.pc.connectionState);

    return sdpAnswer;
  }

  /**
   * Wait for ICE gathering to complete
   */
  private waitForIceGathering(): Promise<void> {
    return new Promise((resolve) => {
      if (this.pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        console.log('[WebRTC] ICE gathering timeout, proceeding with current candidates');
        resolve();
      }, 2000);

      this.pc.onicegatheringstatechange = () => {
        console.log('[WebRTC] ICE gathering state:', this.pc.iceGatheringState);
        if (this.pc.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          resolve();
        }
      };
    });
  }

  /**
   * Adds an ICE candidate received from the server.
   */
  public addIceCandidate(candidate: RTCIceCandidateInit): void {
    this.pc.addIceCandidate(candidate).catch(err => {
      console.error('[WebRTC] Error adding ICE candidate:', err);
    });
  }

  /**
   * Adds a local audio track to be sent to the peer.
   */
  public addTrack(track: MediaStreamTrack, stream: MediaStream): void {
    this.pc.addTrack(track, stream);
  }

  /**
   * Closes the WebRTC connection.
   */
  public close(): void {
    this.pc.close();
  }

  // Basic event emitter implementation
  public on<K extends keyof WebRTCClientEventMap>(event: K, listener: WebRTCClientEventMap[K]): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event]!.push(listener);
  }

  private emit<K extends keyof WebRTCClientEventMap>(event: K, ...args: Parameters<WebRTCClientEventMap[K]>): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach(listener => (listener as any)(...args));
    }
  }
}
