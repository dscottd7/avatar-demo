import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlPanel from '../ControlPanel';

// Mock the useAudioState and useAppStore hooks to avoid infinite loop issues
vi.mock('@/lib/stores/useAppStore', () => ({
  useAudioState: vi.fn(() => ({
    isMuted: false,
    isUserTalking: false,
    isAvatarSpeaking: false,
  })),
  useAppStore: vi.fn((selector) => {
    const mockState = {
      setMuted: vi.fn(),
    };
    return selector ? selector(mockState) : mockState;
  }),
}));

describe('ControlPanel', () => {
  const mockOnStopSession = vi.fn();
  const mockOnInterrupt = vi.fn();

  it('renders all control buttons', () => {
    render(<ControlPanel onStopSession={mockOnStopSession} onInterrupt={mockOnInterrupt} />);

    expect(screen.getByRole('button', { name: /mute microphone/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /interrupt avatar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop session/i })).toBeInTheDocument();
  });

  it('displays microphone active status by default', () => {
    render(<ControlPanel onStopSession={mockOnStopSession} onInterrupt={mockOnInterrupt} />);

    expect(screen.getByText(/microphone active/i)).toBeInTheDocument();
  });

  it('calls onStopSession when stop button is clicked', () => {
    render(<ControlPanel onStopSession={mockOnStopSession} onInterrupt={mockOnInterrupt} />);

    const stopButton = screen.getByRole('button', { name: /stop session/i });
    fireEvent.click(stopButton);

    expect(mockOnStopSession).toHaveBeenCalledTimes(1);
  });

  it('disables interrupt button when avatar is not speaking', () => {
    render(<ControlPanel onStopSession={mockOnStopSession} onInterrupt={mockOnInterrupt} />);

    const interruptButton = screen.getByRole('button', { name: /interrupt avatar/i });
    expect(interruptButton).toBeDisabled();
  });

  it('applies correct button styling for mute button', () => {
    render(<ControlPanel onStopSession={mockOnStopSession} onInterrupt={mockOnInterrupt} />);

    const muteButton = screen.getByRole('button', { name: /mute microphone/i });
    expect(muteButton).toHaveClass('btn-secondary');
  });
});
