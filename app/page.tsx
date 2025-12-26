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
  const resetSession = useAppStore((state) => state.resetSession);
  const addMessage = useAppStore((state) => state.addMessage);

  // Get OpenAI API key from environment (client-side for Phase 5)
  // ⚠️ WARNING: This exposes the API key in the browser bundle!
  const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

  // Use the integrated Kai session hook
  const {
    startSession,
    stopSession,
    toggleMute,
    interrupt,
    isSessionActive,
    isConnecting,
    isMicrophoneActive,
    isMuted,
    error,
    attachVideo,
    isStreamReady,
  } = useKaiSession({
    openaiApiKey,
    autoStartMicrophone: true,
  });

  const handleStartSession = async () => {
    try {
      await startSession();
      console.log('[App] Kai session started successfully');
    } catch (error) {
      console.error('[App] Failed to start session:', error);
    }
  };

  const handleStopSession = async () => {
    try {
      await stopSession();
      resetSession();
      console.log('[App] Kai session stopped successfully');
    } catch (error) {
      console.error('[App] Failed to stop session:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    // Add user message to chat history
    addMessage({
      role: 'user',
      content: message,
    });

    // Note: With OpenAI integration, voice is the primary mode
    // Text input is still available but voice provides the full experience
    // For text-only messages, we could potentially:
    // 1. Send to OpenAI as text
    // 2. Get response
    // 3. Forward to HeyGen
    // But for now, we'll just display in chat
    console.log('[App] Text message sent:', message);
  };

  const handleInterrupt = () => {
    interrupt();
    console.log('[App] Avatar interrupted');
  };

  const handleToggleMute = () => {
    toggleMute();
  };

  // Show landing page if session is not active
  if (!isSessionActive) {
    return <LandingPage onStartSession={handleStartSession} />;
  }

  // Show main session UI
  return (
    <div className="min-h-screen flex flex-col p-8 gap-6">
      <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
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

        {/* Chat History */}
        <ChatHistory />

        {/* Text Input */}
        <TextInput
          onSend={handleSendMessage}
          disabled={isConnecting || !isStreamReady}
        />

        {/* Control Panel */}
        <ControlPanel
          onStopSession={handleStopSession}
          onInterrupt={handleInterrupt}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
        />
      </div>
    </div>
  );
}
