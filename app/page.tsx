'use client';

import { useSessionState, useAppStore } from '@/lib/stores/useAppStore';
import { useHeygenSession } from '@/lib/hooks/useHeygenSession';
import LandingPage from '@/components/LandingPage';
import AvatarVideo from '@/components/AvatarVideo';
import ChatHistory from '@/components/ChatHistory';
import TextInput from '@/components/TextInput';
import ControlPanel from '@/components/ControlPanel';

export default function Home() {
  const { sessionActive } = useSessionState();
  const setSessionActive = useAppStore((state) => state.setSessionActive);
  const addMessage = useAppStore((state) => state.addMessage);
  const resetSession = useAppStore((state) => state.resetSession);

  const {
    startSession: startHeygenSession,
    stopSession: stopHeygenSession,
    speak,
    interrupt,
    isConnecting,
    error: heygenError,
    mediaStream,
  } = useHeygenSession();

  const handleStartSession = async () => {
    try {
      await startHeygenSession();
      setSessionActive(true);
      console.log('[App] Session started successfully');
    } catch (error) {
      console.error('[App] Failed to start session:', error);
    }
  };

  const handleStopSession = async () => {
    try {
      await stopHeygenSession();
      resetSession();
      console.log('[App] Session stopped successfully');
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

    try {
      // Send message to HeyGen avatar
      await speak(message);

      // In Phase 5, this will also send to OpenAI Realtime API
      // For now, just add a placeholder response
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: message, // Avatar will speak this text
        });
      }, 500);
    } catch (error) {
      console.error('[App] Failed to send message:', error);
    }
  };

  const handleInterrupt = () => {
    interrupt();
    console.log('[App] Avatar interrupted');
  };

  // Show landing page if session is not active
  if (!sessionActive) {
    return <LandingPage onStartSession={handleStartSession} />;
  }

  // Show main session UI
  return (
    <div className="min-h-screen flex flex-col p-8 gap-6">
      <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Error Display */}
        {heygenError && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400">Error: {heygenError}</p>
          </div>
        )}

        {/* Avatar Video */}
        <AvatarVideo
          sessionActive={sessionActive}
          mediaStream={mediaStream}
          isConnecting={isConnecting}
        />

        {/* Chat History */}
        <ChatHistory />

        {/* Text Input */}
        <TextInput
          onSend={handleSendMessage}
          disabled={isConnecting || !mediaStream}
        />

        {/* Control Panel */}
        <ControlPanel
          onStopSession={handleStopSession}
          onInterrupt={handleInterrupt}
        />
      </div>
    </div>
  );
}
