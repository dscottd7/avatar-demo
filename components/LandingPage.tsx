'use client';

interface LandingPageProps {
  onStartSession: () => void;
}

export default function LandingPage({ onStartSession }: LandingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Kai - AI Avatar
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Experience real-time conversations with an AI avatar powered by HeyGen and OpenAI
        </p>

        <button
          onClick={onStartSession}
          className="btn-primary text-lg px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          Start Chat with Kai
        </button>

        <div className="mt-12 text-sm text-gray-500">
          <p>This will request access to your microphone</p>
          <p className="mt-2">You can also use text chat if you prefer</p>
        </div>
      </div>
    </div>
  );
}
