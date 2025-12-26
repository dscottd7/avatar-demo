import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AvatarVideo from '../AvatarVideo';

describe('AvatarVideo', () => {
  it('renders video element', () => {
    const { container } = render(<AvatarVideo sessionActive={true} />);
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('displays loading message when session is not active', () => {
    render(<AvatarVideo sessionActive={false} />);
    expect(screen.getByText(/initializing avatar/i)).toBeInTheDocument();
  });

  it('does not display loading message when session is active', () => {
    render(<AvatarVideo sessionActive={true} />);
    expect(screen.queryByText(/initializing avatar/i)).not.toBeInTheDocument();
  });

  it('video has correct attributes', () => {
    const { container } = render(<AvatarVideo sessionActive={true} />);
    const video = container.querySelector('video') as HTMLVideoElement;

    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline');
    expect(video.muted).toBe(false);
  });

  it('applies correct container styling', () => {
    const { container } = render(<AvatarVideo sessionActive={true} />);
    const videoContainer = container.querySelector('.relative.aspect-video');

    expect(videoContainer).toBeInTheDocument();
  });
});
