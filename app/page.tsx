'use client';

import { useAppStore } from '@/lib/stores/useAppStore';
import { useKaiSession } from '@/lib/hooks/useKaiSession';
import LandingPage from '@/components/LandingPage';
import AvatarVideo from '@/components/AvatarVideo';
import ChatHistory from '@/components/ChatHistory';
import TextInput from '@/components/TextInput';
import ControlPanel from '@/components/ControlPanel';

/**
 * Main App Component
 *
 * ⚠️ SECURITY NOTE: This implementation uses client-side OpenAI API key
 * for rapid prototyping. NOT suitable for production.
 * The API key is exposed in the browser. See Phase 6 for secure approach.
 */
export default function Home() {
  const {
    startSession,
    stopSession,
    isSessionActive,
    isConnecting,
    error,
    attachVideo,
    isStreamReady,
    interrupt,
    toggleMute,
    isMuted,
    isMicrophoneActive,
  } = useKaiSession();

  const handleSendMessage = (message: string) => {
    // Note: With the WebRTC implementation, voice is the primary input.
    // This function is a placeholder for a potential future text-to-speech implementation.
    console.log(`[App] Text message input received: ${message}`);
  };

  // Show landing page if session is not active
  if (!isSessionActive) {
    return <LandingPage onStartSession={startSession} />;
  }

  // Show main session UI
  return (
    <div className="min-h-screen flex flex-col p-8">
      <div className="flex-1 flex gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column - Avatar and Controls */}
        <div className="flex flex-col gap-4 w-1/2">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}

          {/* Microphone Status Indicator */}
          {isMicrophoneActive && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                <p className="text-blue-300 text-sm">
                  {isMuted ? 'Microphone muted' : 'Microphone active - speak to Kai'}
                </p>
              </div>
            </div>
          )}

          {/* Avatar Video */}
          <AvatarVideo
            sessionActive={isSessionActive}
            isConnecting={isConnecting}
            isStreamReady={isStreamReady}
            onVideoReady={attachVideo}
          />

          {/* Control Panel */}
          <ControlPanel
            onStopSession={stopSession}
            onInterrupt={interrupt}
          />
        </div>

        {/* Right Column - Chat */}
        <div className="flex flex-col gap-4 w-1/2">
          {/* Chat History */}
          <ChatHistory />

          {/* Text Input */}
          <TextInput
            onSend={handleSendMessage}
            disabled={isConnecting || !isStreamReady}
          />
        </div>
      </div>
    </div>
  );
}
