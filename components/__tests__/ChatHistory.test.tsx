import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatHistory from '../ChatHistory';
import { useAppStore } from '@/lib/stores/useAppStore';

describe('ChatHistory', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.getState().clearMessages();

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders empty chat history when no messages', () => {
    const { container } = render(<ChatHistory />);
    const messagesContainer = container.querySelector('.custom-scrollbar');
    expect(messagesContainer).toBeInTheDocument();
    expect(messagesContainer?.children.length).toBe(1); // Only the ref div
  });

  it('displays user messages with correct styling', () => {
    useAppStore.getState().addMessage({
      role: 'user',
      content: 'Hello, Kai!',
    });

    render(<ChatHistory />);
    const message = screen.getByText('Hello, Kai!');
    expect(message).toBeInTheDocument();
    expect(message.closest('.message-user')).toBeInTheDocument();
  });

  it('displays assistant messages with correct styling', () => {
    useAppStore.getState().addMessage({
      role: 'assistant',
      content: 'Hello! How can I help you?',
    });

    render(<ChatHistory />);
    const message = screen.getByText('Hello! How can I help you?');
    expect(message).toBeInTheDocument();
    expect(message.closest('.message-assistant')).toBeInTheDocument();
  });

  it('displays multiple messages in order', () => {
    useAppStore.getState().addMessage({
      role: 'user',
      content: 'First message',
    });
    useAppStore.getState().addMessage({
      role: 'assistant',
      content: 'Second message',
    });
    useAppStore.getState().addMessage({
      role: 'user',
      content: 'Third message',
    });

    render(<ChatHistory />);

    const messages = screen.getAllByRole('paragraph');
    expect(messages).toHaveLength(3);
    expect(messages[0]).toHaveTextContent('First message');
    expect(messages[1]).toHaveTextContent('Second message');
    expect(messages[2]).toHaveTextContent('Third message');
  });

  it('applies custom scrollbar class', () => {
    const { container } = render(<ChatHistory />);
    const scrollContainer = container.querySelector('.custom-scrollbar');
    expect(scrollContainer).toBeInTheDocument();
  });
});
