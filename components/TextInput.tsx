'use client';

import { useState } from 'react';

interface TextInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function TextInput({ onSend, disabled = false }: TextInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className="input-field flex-1"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="btn-primary px-8"
        >
          Send
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        Press Enter to send • {message.length}/500 characters
      </p>
    </div>
  );
}
