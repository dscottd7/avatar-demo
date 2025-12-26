import { NextRequest, NextResponse } from 'next/server';
import {
  keepHeyGenSessionAlive,
  isValidSessionId,
} from '@/lib/heygen/session';

/**
 * POST /api/keep-session-alive
 * Sends a keep-alive ping to maintain the HeyGen session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id } = body;

    // Validate session ID
    if (!session_id || !isValidSessionId(session_id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid session ID',
          message: 'session_id is required and must be a valid string',
        },
        { status: 400 }
      );
    }

    // Send keep-alive ping
    const result = await keepHeyGenSessionAlive(session_id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error keeping HeyGen session alive:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to keep session alive',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
