'use client';

import { useState } from 'react';
import { useSessionState, useAppStore } from '@/lib/stores/useAppStore';
import LandingPage from '@/components/LandingPage';
import AvatarVideo from '@/components/AvatarVideo';
import ChatHistory from '@/components/ChatHistory';
import TextInput from '@/components/TextInput';
import ControlPanel from '@/components/ControlPanel';

export default function Home() {
  const { sessionActive } = useSessionState();
  const [isStarting, setIsStarting] = useState(false);
  const setSessionActive = useAppStore((state) => state.setSessionActive);
  const addMessage = useAppStore((state) => state.addMessage);
  const resetSession = useAppStore((state) => state.resetSession);

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      // In Phase 4, this will call the API to start the HeyGen session
      // For now, just activate the session UI
      setSessionActive(true);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopSession = async () => {
    try {
      // In Phase 4, this will call the API to stop the HeyGen session
      resetSession();
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  const handleSendMessage = (message: string) => {
    // Add user message to chat history
    addMessage({
      role: 'user',
      content: message,
    });

    // In Phase 5, this will send the message via OpenAI Realtime API
    // For now, just echo it back as assistant message (placeholder)
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `Echo: ${message}`,
      });
    }, 500);
  };

  const handleInterrupt = () => {
    // In Phase 4, this will interrupt the avatar
    console.log('Interrupt avatar');
  };

  // Show landing page if session is not active
  if (!sessionActive) {
    return <LandingPage onStartSession={handleStartSession} />;
  }

  // Show main session UI
  return (
    <div className="min-h-screen flex flex-col p-8 gap-6">
      <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Avatar Video */}
        <AvatarVideo sessionActive={sessionActive} />

        {/* Chat History */}
        <ChatHistory />

        {/* Text Input */}
        <TextInput
          onSend={handleSendMessage}
          disabled={isStarting}
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
