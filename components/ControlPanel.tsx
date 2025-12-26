'use client';

import { useAudioState, useAppStore } from '@/lib/stores/useAppStore';

interface ControlPanelProps {
  onStopSession: () => void;
  onInterrupt: () => void;
}

export default function ControlPanel({ onStopSession, onInterrupt }: ControlPanelProps) {
  const { isMuted, isAvatarSpeaking } = useAudioState();
  const setMuted = useAppStore((state) => state.setMuted);

  const toggleMute = () => setMuted(!isMuted);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex gap-4 justify-center items-center">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`${
            isMuted ? 'btn-danger' : 'btn-secondary'
          } flex items-center gap-2 px-6`}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
              Unmute
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              Mute
            </>
          )}
        </button>

        {/* Interrupt Button */}
        <button
          onClick={onInterrupt}
          disabled={!isAvatarSpeaking}
          className="btn-secondary flex items-center gap-2 px-6"
          aria-label="Interrupt avatar"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          Interrupt
        </button>

        {/* Stop Session Button */}
        <button
          onClick={onStopSession}
          className="btn-danger flex items-center gap-2 px-6"
          aria-label="Stop session"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          Stop
        </button>
      </div>

      {/* Status Indicators */}
      <div className="mt-4 flex gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="text-gray-400">
            {isMuted ? 'Microphone muted' : 'Microphone active'}
          </span>
        </div>
        {isAvatarSpeaking && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-gray-400">Avatar speaking</span>
          </div>
        )}
      </div>
    </div>
  );
}
