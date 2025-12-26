'use client';

import { useRef, useEffect } from 'react';

interface AvatarVideoProps {
  sessionActive: boolean;
  mediaStream: MediaStream | null;
  isConnecting: boolean;
}

export default function AvatarVideo({ sessionActive, mediaStream, isConnecting }: AvatarVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      console.log('[AvatarVideo] Media stream attached to video element');
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [mediaStream]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={false}
        />

        {(!sessionActive || isConnecting || !mediaStream) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
              <p className="text-gray-300 text-lg">
                {isConnecting ? 'Connecting to avatar...' : 'Initializing avatar...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
