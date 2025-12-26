import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AvatarVideo from '../AvatarVideo';

describe('AvatarVideo', () => {
  it('renders video element', () => {
    const { container } = render(
      <AvatarVideo sessionActive={true} isConnecting={false} isStreamReady={false} />
    );
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('displays loading message when session is not active', () => {
    render(<AvatarVideo sessionActive={false} isConnecting={false} isStreamReady={false} />);
    expect(screen.getByText(/initializing avatar/i)).toBeInTheDocument();
  });

  it('displays connecting message when connecting', () => {
    render(<AvatarVideo sessionActive={true} isConnecting={true} isStreamReady={false} />);
    expect(screen.getByText(/connecting to avatar/i)).toBeInTheDocument();
  });

  it('does not display loading message when stream is ready', () => {
    render(
      <AvatarVideo sessionActive={true} isConnecting={false} isStreamReady={true} />
    );
    expect(screen.queryByText(/initializing avatar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/connecting to avatar/i)).not.toBeInTheDocument();
  });

  it('calls onVideoReady when video element is mounted', () => {
    const mockOnVideoReady = vi.fn();
    render(
      <AvatarVideo
        sessionActive={true}
        isConnecting={false}
        isStreamReady={false}
        onVideoReady={mockOnVideoReady}
      />
    );

    expect(mockOnVideoReady).toHaveBeenCalled();
    const videoElement = mockOnVideoReady.mock.calls[0][0];
    expect(videoElement).toBeInstanceOf(HTMLVideoElement);
  });

  it('video has correct attributes', () => {
    const { container } = render(
      <AvatarVideo sessionActive={true} isConnecting={false} isStreamReady={false} />
    );
    const video = container.querySelector('video') as HTMLVideoElement;

    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline');
    expect(video.muted).toBe(false);
  });

  it('applies correct container styling', () => {
    const { container } = render(
      <AvatarVideo sessionActive={true} isConnecting={false} isStreamReady={false} />
    );
    const videoContainer = container.querySelector('.relative.aspect-video');

    expect(videoContainer).toBeInTheDocument();
  });
});
