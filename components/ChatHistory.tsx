'use client';

import { useEffect, useRef } from 'react';
import { useMessages } from '@/lib/stores/useAppStore';

export default function ChatHistory() {
  const messages = useMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-300">Conversation History</h2>

      <div className="bg-gray-900/50 rounded-xl p-4 h-64 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Start a conversation with Kai...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${
                  message.role === 'user' ? 'message-user' : 'message-assistant'
                } border`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-sm text-gray-400">
                    {message.role === 'user' ? 'You' : 'Kai'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-gray-200">{message.content}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
