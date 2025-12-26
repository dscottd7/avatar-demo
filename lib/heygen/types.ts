// HeyGen API Types

export interface HeyGenSessionRequest {
  mode: 'CUSTOM';
  avatar_id: string;
}

export interface HeyGenSessionResponse {
  session_id: string;
  session_token: string;
  ice_servers: Array<{
    urls: string[];
    username?: string;
    credential?: string;
  }>;
  websocket_url: string;
}

export interface HeyGenStopSessionRequest {
  session_id: string;
}

export interface HeyGenStopSessionResponse {
  success: boolean;
  message?: string;
}

export interface HeyGenKeepAliveRequest {
  session_id: string;
}

export interface HeyGenKeepAliveResponse {
  success: boolean;
  message?: string;
}

export interface HeyGenErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

// WebSocket Event Types
export type HeyGenWebSocketEvent =
  | 'session.state_updated'
  | 'agent.speak_started'
  | 'agent.speak_ended'
  | 'agent.listening_started'
  | 'agent.listening_ended';

export interface HeyGenSessionState {
  state: 'connecting' | 'connected' | 'disconnected' | 'closed';
  timestamp: number;
}
