import type {
  HeyGenSessionRequest,
  HeyGenSessionResponse,
  HeyGenStopSessionResponse,
  HeyGenKeepAliveResponse,
} from './types';

const HEYGEN_API_BASE_URL = 'https://api.heygen.com/v1';

/**
 * Creates a new HeyGen streaming session
 * @param avatarId - The ID of the HeyGen avatar to use
 * @returns Session token and connection details
 */
export async function createHeyGenSession(
  avatarId: string
): Promise<HeyGenSessionResponse> {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    throw new Error('HEYGEN_API_KEY is not configured');
  }

  const requestBody: HeyGenSessionRequest = {
    mode: 'CUSTOM',
    avatar_id: avatarId,
  };

  const response = await fetch(`${HEYGEN_API_BASE_URL}/streaming.new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `HeyGen API error: ${response.status} - ${
        errorData.message || response.statusText
      }`
    );
  }

  const data = await response.json();

  // HeyGen API returns data in a 'data' field
  if (data.data) {
    return data.data as HeyGenSessionResponse;
  }

  return data as HeyGenSessionResponse;
}

/**
 * Stops an active HeyGen streaming session
 * @param sessionId - The ID of the session to stop
 * @returns Success status
 */
export async function stopHeyGenSession(
  sessionId: string
): Promise<HeyGenStopSessionResponse> {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    throw new Error('HEYGEN_API_KEY is not configured');
  }

  const response = await fetch(`${HEYGEN_API_BASE_URL}/streaming.stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `HeyGen API error: ${response.status} - ${
        errorData.message || response.statusText
      }`
    );
  }

  const data = await response.json();
  return { success: true, message: data.message };
}

/**
 * Sends a keep-alive ping to maintain the HeyGen session
 * @param sessionId - The ID of the session to keep alive
 * @returns Success status
 */
export async function keepHeyGenSessionAlive(
  sessionId: string
): Promise<HeyGenKeepAliveResponse> {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    throw new Error('HEYGEN_API_KEY is not configured');
  }

  const response = await fetch(`${HEYGEN_API_BASE_URL}/streaming.ice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `HeyGen API error: ${response.status} - ${
        errorData.message || response.statusText
      }`
    );
  }

  return { success: true };
}

/**
 * Validates a session ID format
 * @param sessionId - The session ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidSessionId(sessionId: string): boolean {
  return typeof sessionId === 'string' && sessionId.length > 0;
}
