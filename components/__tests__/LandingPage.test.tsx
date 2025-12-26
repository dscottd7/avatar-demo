import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from '../LandingPage';

describe('LandingPage', () => {
  it('renders the landing page with title and description', () => {
    const mockOnStartSession = vi.fn();
    render(<LandingPage onStartSession={mockOnStartSession} />);

    expect(screen.getByText(/Kai - AI Avatar/i)).toBeInTheDocument();
    expect(screen.getByText(/Experience real-time conversations/i)).toBeInTheDocument();
  });

  it('renders the start button', () => {
    const mockOnStartSession = vi.fn();
    render(<LandingPage onStartSession={mockOnStartSession} />);

    const button = screen.getByRole('button', { name: /start chat with kai/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onStartSession when start button is clicked', () => {
    const mockOnStartSession = vi.fn();
    render(<LandingPage onStartSession={mockOnStartSession} />);

    const button = screen.getByRole('button', { name: /start chat with kai/i });
    fireEvent.click(button);

    expect(mockOnStartSession).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling classes', () => {
    const mockOnStartSession = vi.fn();
    const { container } = render(<LandingPage onStartSession={mockOnStartSession} />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('min-h-screen');
  });
});
