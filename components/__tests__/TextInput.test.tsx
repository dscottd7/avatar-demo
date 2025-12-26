import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TextInput from '../TextInput';

describe('TextInput', () => {
  it('renders input field and send button', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={false} />);

    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays character counter', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={false} />);

    expect(screen.getByText(/0\/500 characters/i)).toBeInTheDocument();
  });

  it('updates character counter when typing', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={false} />);

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(screen.getByText(/5\/500 characters/i)).toBeInTheDocument();
  });

  it('calls onSend when form is submitted with Enter key', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={false} />);

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('calls onSend when send button is clicked', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={false} />);

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('clears input after sending message', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={false} />);

    const input = screen.getByPlaceholderText(/type a message/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);

    expect(input.value).toBe('');
  });

  it('does not call onSend when message is empty', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={false} />);

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.submit(input.closest('form')!);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('trims whitespace from message before sending', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={false} />);

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: '  Test message  ' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('disables input and button when disabled prop is true', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={true} />);

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('does not send message when disabled', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={true} />);

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('enforces 500 character limit', () => {
    const mockOnSend = vi.fn();
    render(<TextInput onSend={mockOnSend} disabled={false} />);

    const input = screen.getByPlaceholderText(/type a message/i) as HTMLInputElement;
    expect(input).toHaveAttribute('maxlength', '500');
  });
});
