/**
 * POST /api/openai-call
 * Proxies a WebRTC SDP offer to the OpenAI /v1/realtime endpoint
 * and returns the SDP answer for establishing a peer connection.
 */
import { NextResponse } from 'next/server';
import { avatarConfig } from '@/config/avatar.config';

export async function POST(request: Request) {
  try {
    console.log('[API] Received request to create OpenAI WebRTC call...');

    const { sdp } = await request.json();
    if (!sdp) {
      return NextResponse.json(
        { success: false, error: 'SDP offer is missing from the request body' },
        { status: 400 }
      );
    }

    // Build the OpenAI Realtime API URL with model as query parameter
    const model = avatarConfig.openai.model;
    const openaiUrl = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`;

    console.log('[API] Sending SDP offer to OpenAI:', openaiUrl);

    // Send the SDP offer directly as the body with application/sdp content type
    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp',
      },
      body: sdp,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[API] OpenAI error response:', errorText);
      throw new Error(
        `OpenAI API error: ${response.status} - ${errorText || response.statusText}`
      );
    }

    // The response is the SDP answer as plain text
    const sdpAnswer = await response.text();
    console.log('[API] Successfully received SDP answer from OpenAI');

    return NextResponse.json({
      success: true,
      data: { sdp: sdpAnswer },
    });

  } catch (error) {
    console.error('[API] Error creating OpenAI call:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create OpenAI call',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}