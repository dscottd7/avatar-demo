/**
 * OpenAI Realtime API WebSocket Client
 * Handles WebSocket connection to OpenAI's Realtime API
 *
 * ⚠️ SECURITY NOTE: This implementation uses client-side API key
 * for rapid prototyping. NOT suitable for production.
 * See Phase 6 for secure token-based approach.
 */

import {
  ClientEventType,
  ServerEventType,
  SessionConfig,
  RealtimeServerEvent,
  RealtimeClientEvent,
  SessionUpdateEvent,
  InputAudioBufferAppendEvent,
  ResponseCreateEvent,
} from './types';

export type RealtimeEventHandler = (event: RealtimeServerEvent) => void;

export interface RealtimeClientConfig {
  apiKey: string;
  model?: string;
  sessionConfig?: Partial<SessionConfig>;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onEvent?: RealtimeEventHandler;
}

export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeClientConfig;
  private eventHandlers: Map<string, Set<RealtimeEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: RealtimeClientConfig) {
    this.config = config;
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const model = this.config.model || 'gpt-4o-realtime-preview-2024-12-17';
        // Include API key as Authorization header via base64 encoding in URL
        // Note: Browser WebSocket API doesn't support custom headers directly
        const authHeader = btoa(`api:${this.config.apiKey}`);
        const url = `wss://api.openai.com/v1/realtime?model=${model}`;

        console.log('[OpenAI] Connecting to Realtime API...');

        // For browser WebSocket, we'll need to handle auth differently
        // OpenAI Realtime API expects the key in the Authorization header
        // which we can't set directly in browser WebSocket
        // Solution: Send auth in first message or use WebSocket subprotocol
        this.ws = new WebSocket(url, [`realtime`, `Bearer.${this.config.apiKey}`]);

        this.ws.onopen = () => {
          console.log('[OpenAI] Connected to Realtime API');
          this.reconnectAttempts = 0;

          // Send session configuration if provided
          if (this.config.sessionConfig) {
            this.updateSession(this.config.sessionConfig);
          }

          this.config.onOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const serverEvent = JSON.parse(event.data) as RealtimeServerEvent;
            this.handleServerEvent(serverEvent);
          } catch (error) {
            console.error('[OpenAI] Error parsing message:', error);
          }
        };

        this.ws.onerror = (event) => {
          console.error('[OpenAI] WebSocket error:', event);
          const error = new Error('WebSocket connection error');
          this.config.onError?.(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[OpenAI] WebSocket closed:', event.code, event.reason);
          this.ws = null;
          this.config.onClose?.();

          // Attempt reconnection if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[OpenAI] Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to the WebSocket
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(`[OpenAI] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[OpenAI] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Disconnect from OpenAI Realtime API
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.eventHandlers.clear();
    console.log('[OpenAI] Disconnected from Realtime API');
  }

  /**
   * Send a client event to OpenAI
   */
  private sendEvent(event: RealtimeClientEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[OpenAI] Cannot send event: WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(event));
    } catch (error) {
      console.error('[OpenAI] Error sending event:', error);
    }
  }

  /**
   * Handle incoming server events
   */
  private handleServerEvent(event: RealtimeServerEvent): void {
    // Call global event handler
    this.config.onEvent?.(event);

    // Call specific event handlers
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }

    // Log errors
    if (event.type === ServerEventType.ERROR) {
      console.error('[OpenAI] Server error:', event.error);
    }
  }

  /**
   * Register an event handler for a specific event type
   */
  on(eventType: ServerEventType | string, handler: RealtimeEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Unregister an event handler
   */
  off(eventType: ServerEventType | string, handler: RealtimeEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Update session configuration
   */
  updateSession(config: Partial<SessionConfig>): void {
    const event: SessionUpdateEvent = {
      type: ClientEventType.SESSION_UPDATE,
      session: config,
    };
    this.sendEvent(event);
    console.log('[OpenAI] Session configuration updated');
  }

  /**
   * Send audio data to OpenAI
   * @param audioBase64 - Base64 encoded PCM16 audio
   */
  sendAudio(audioBase64: string): void {
    const event: InputAudioBufferAppendEvent = {
      type: ClientEventType.INPUT_AUDIO_BUFFER_APPEND,
      audio: audioBase64,
    };
    this.sendEvent(event);
  }

  /**
   * Commit the audio buffer (signals end of user speech)
   */
  commitAudio(): void {
    this.sendEvent({
      type: ClientEventType.INPUT_AUDIO_BUFFER_COMMIT,
    });
    console.log('[OpenAI] Audio buffer committed');
  }

  /**
   * Clear the audio buffer
   */
  clearAudioBuffer(): void {
    this.sendEvent({
      type: ClientEventType.INPUT_AUDIO_BUFFER_CLEAR,
    });
    console.log('[OpenAI] Audio buffer cleared');
  }

  /**
   * Request a response from OpenAI
   */
  createResponse(config?: ResponseCreateEvent['response']): void {
    const event: ResponseCreateEvent = {
      type: ClientEventType.RESPONSE_CREATE,
      response: config,
    };
    this.sendEvent(event);
    console.log('[OpenAI] Response requested');
  }

  /**
   * Cancel the current response
   */
  cancelResponse(): void {
    this.sendEvent({
      type: ClientEventType.RESPONSE_CANCEL,
    });
    console.log('[OpenAI] Response cancelled');
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
