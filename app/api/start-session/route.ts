import { NextResponse } from 'next/server';
import { createHeyGenSession } from '@/lib/heygen/session';
import { avatarConfig } from '@/config/avatar.config';

/**
 * POST /api/start-session
 * Creates a new HeyGen streaming session
 */
export async function POST() {
  try {
    // Create HeyGen session using the configured avatar ID
    const sessionData = await createHeyGenSession(avatarConfig.avatarId);

    return NextResponse.json({
      success: true,
      data: sessionData,
    });
  } catch (error) {
    console.error('Error creating HeyGen session:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create HeyGen session',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
