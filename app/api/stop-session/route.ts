import { NextRequest, NextResponse } from 'next/server';
import { stopHeyGenSession, isValidSessionId } from '@/lib/heygen/session';

/**
 * POST /api/stop-session
 * Stops an active HeyGen streaming session
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

    // Stop the HeyGen session
    const result = await stopHeyGenSession(session_id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error stopping HeyGen session:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to stop HeyGen session',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
