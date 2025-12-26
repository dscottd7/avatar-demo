import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AvatarVideo from '../AvatarVideo';

describe('AvatarVideo', () => {
  it('renders video element', () => {
    const { container } = render(
      <AvatarVideo sessionActive={true} mediaStream={null} isConnecting={false} />
    );
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('displays loading message when session is not active', () => {
    render(<AvatarVideo sessionActive={false} mediaStream={null} isConnecting={false} />);
    expect(screen.getByText(/initializing avatar/i)).toBeInTheDocument();
  });

  it('displays connecting message when connecting', () => {
    render(<AvatarVideo sessionActive={true} mediaStream={null} isConnecting={true} />);
    expect(screen.getByText(/connecting to avatar/i)).toBeInTheDocument();
  });

  it('does not display loading message when stream is ready', () => {
    const mockStream = {} as MediaStream;
    render(
      <AvatarVideo sessionActive={true} mediaStream={mockStream} isConnecting={false} />
    );
    expect(screen.queryByText(/initializing avatar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/connecting to avatar/i)).not.toBeInTheDocument();
  });

  it('video has correct attributes', () => {
    const { container } = render(
      <AvatarVideo sessionActive={true} mediaStream={null} isConnecting={false} />
    );
    const video = container.querySelector('video') as HTMLVideoElement;

    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline');
    expect(video.muted).toBe(false);
  });

  it('applies correct container styling', () => {
    const { container } = render(
      <AvatarVideo sessionActive={true} mediaStream={null} isConnecting={false} />
    );
    const videoContainer = container.querySelector('.relative.aspect-video');

    expect(videoContainer).toBeInTheDocument();
  });
});
