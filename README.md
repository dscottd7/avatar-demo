# Kai Avatar Demo

A real-time AI avatar demo that combines HeyGen's streaming avatar technology with OpenAI's Realtime API for natural voice conversations.

## Features

- **Real-time Voice Conversations**: Speak naturally with an AI avatar powered by OpenAI's GPT-4o Realtime API
- **Lip-synced Avatar**: HeyGen's streaming avatar provides realistic lip-sync and expressions
- **WebRTC Integration**: Low-latency audio streaming via WebRTC
- **Live Transcription**: See both user and AI speech transcribed in real-time
- **Two-column Layout**: Avatar video on the left, conversation transcript on the right

## Architecture

```
┌─────────────────┐     WebRTC      ┌─────────────────┐
│                 │◄───────────────►│                 │
│     Browser     │                 │  OpenAI API     │
│   (Microphone)  │                 │  (Realtime)     │
│                 │                 │                 │
└────────┬────────┘                 └────────┬────────┘
         │                                   │
         │ Audio Stream                      │ AI Audio
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│                 │◄────────────────│                 │
│  HeyGen Avatar  │   Audio Feed    │  Audio Processor│
│   (Streaming)   │                 │                 │
│                 │                 │                 │
└─────────────────┘                 └─────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Avatar**: HeyGen Streaming Avatar SDK
- **AI**: OpenAI Realtime API (WebRTC)
- **Testing**: Vitest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- HeyGen API key
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dscottd7/avatar-demo.git
   cd avatar-demo
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env.local` file with your API keys:
   ```env
   HEYGEN_API_KEY=your_heygen_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── openai-call/      # WebRTC SDP proxy for OpenAI
│   │   ├── start-session/    # HeyGen session initialization
│   │   └── stop-session/     # HeyGen session cleanup
│   └── page.tsx              # Main application page
├── components/
│   ├── AvatarVideo.tsx       # Video player for HeyGen stream
│   ├── ChatHistory.tsx       # Conversation transcript
│   ├── ControlPanel.tsx      # Session controls
│   ├── LandingPage.tsx       # Start session UI
│   └── TextInput.tsx         # Text input (placeholder)
├── lib/
│   ├── hooks/
│   │   ├── useHeygenSession.ts   # HeyGen SDK wrapper
│   │   ├── useKaiSession.ts      # Main session orchestrator
│   │   ├── useMicrophone.ts      # Microphone capture
│   │   └── useOpenAIWebRTC.ts    # OpenAI WebRTC connection
│   ├── openai/
│   │   ├── audio.ts              # Audio processing utilities
│   │   └── webrtc.ts             # WebRTC client for OpenAI
│   └── stores/
│       └── useAppStore.ts        # Zustand state management
└── config/
    └── avatar.config.ts          # Avatar and AI configuration
```

## Configuration

Edit `config/avatar.config.ts` to customize:

```typescript
export const avatarConfig = {
  avatarId: '7b888024-f8c9-4205-95e1-78ce01497bda', // HeyGen avatar ID
  openai: {
    model: 'gpt-4o-mini-realtime-preview',
    voice: 'cedar', // alloy, echo, fable, onyx, nova, shimmer, cedar
  },
  systemPrompt: `You are Kai, a helpful AI avatar...`,
};
```

## Testing

Run the test suite:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

## How It Works

1. **Session Start**: User clicks "Start Session" which initializes both HeyGen and OpenAI connections
2. **Microphone Capture**: Browser captures audio from the user's microphone
3. **WebRTC Connection**: Audio is streamed to OpenAI via WebRTC for real-time processing
4. **AI Processing**: OpenAI transcribes speech, generates a response, and streams audio back
5. **Avatar Rendering**: AI audio is forwarded to HeyGen, which renders the avatar speaking with lip-sync
6. **Transcription Display**: Both user and AI speech are transcribed and displayed in the chat

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/start-session` | POST | Initialize HeyGen streaming session |
| `/api/stop-session` | POST | Terminate HeyGen session |
| `/api/openai-call` | POST | Proxy WebRTC SDP offer to OpenAI |

## License

MIT
