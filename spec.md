# Kai Avatar Prototype - Technical Specification

## Project Overview

**Project Name:** Kai Avatar Prototype
**Purpose:** Demonstrate and test HeyGen LiveAvatar technology integrated with OpenAI's Realtime API
**Scope:** Minimal, functional prototype for local development and testing

## Executive Summary

Kai is a general-purpose conversational AI avatar that combines HeyGen's LiveAvatar CUSTOM mode with OpenAI's Realtime API to create real-time voice and text interactions. The avatar is designed to be helpful, friendly, and capable of engaging in natural conversations with users.

---

## Technical Stack

### Core Technologies
- **Frontend Framework:** Next.js 15+ with React 19+
- **Language:** TypeScript
- **Styling:** Tailwind CSS (dark mode)
- **State Management:** Zustand (recommended for connection states, mute status, etc.)
- **Package Manager:** pnpm

### Third-Party Services
- **Avatar Video:** HeyGen LiveAvatar (CUSTOM mode)
- **LLM & Voice:** OpenAI Realtime API (gpt-4o-mini-realtime-preview)
- **WebRTC:** LiveKit (provided by HeyGen)

### Reference Implementation
- Based on: [HeyGen LiveAvatar Web SDK Demo](https://github.com/heygen-com/liveavatar-web-sdk/tree/master/apps/demo)

---

## Architecture Overview

### System Architecture (Revised for WebRTC)

```
User (Browser)
    │
    ├─> 1. Get HeyGen Token
    │
Next.js Frontend
    │   └─> /api/heygen-session (Handles HeyGen token)
    │
    ├─> 2. Create WebRTC Offer
    │
    ├─> 3. POST Offer to Backend
    │   │
    │   └─> /api/openai-call
    │       │
    │       └─> POST to OpenAI /v1/realtime/calls
    │           (Returns SDP Answer)
    │
    ├─> 4. Receive SDP Answer
    │
    └─> 5. Establish Peer Connection
        │
        └─> Direct WebRTC Connection to OpenAI
            (Bi-directional Audio Stream)
```

### OpenAI Realtime Flow (WebRTC)

The connection to OpenAI is not a simple WebSocket, but a **WebRTC peer connection**.

1.  **Client Creates Offer:** The browser generates a WebRTC "offer" (using Session Description Protocol - SDP), which describes how it wants to communicate.
2.  **Backend Creates Call:** The client sends this SDP offer to our backend API route (`/api/openai-call`). The backend securely forwards this offer to OpenAI's `POST /v1/realtime/calls` endpoint.
3.  **OpenAI Returns Answer:** OpenAI's server processes the offer and returns an SDP "answer".
4.  **Peer Connection Established:** The backend passes this answer back to the client. The client uses the answer to establish a direct, peer-to-peer WebRTC connection with OpenAI's media servers for low-latency, bi-directional audio streaming.
5.  **Conversation:** The user's microphone audio is sent over this WebRTC connection, and the AI's audio response is received on the same connection.

---

## Features & Functionality

### Core Features (MVP)

✅ **Real-time Voice Conversation**
- Automatic voice activation (no push-to-talk)
- Real-time speech recognition via OpenAI Realtime API
- Real-time avatar response with lip-sync
- Natural conversation flow with minimal latency

✅ **Text Chat Alternative**
- Text input field for typing messages
- Fallback for users without microphone access
- Same conversation flow as voice

✅ **Conversation History**
- Display transcript of conversation
- Show both user messages and Kai responses
- Scrollable chat history panel

✅ **User Controls**
- **Mute Button:** Mute user's microphone
- **Interrupt Button:** Stop avatar while speaking
- **Stop Button:** End entire session and reset

✅ **Avatar Video Display**
- Full-screen or prominent video container
- WebRTC streaming via LiveKit
- Real-time lip-sync to generated audio

### Features Explicitly Excluded (v1)

❌ Transcript download/export
❌ User authentication
❌ Session persistence across page refresh
❌ Multiple avatar selection
❌ Analytics/logging
❌ Deployment configuration (local only)
❌ Explicit state indicators (listening/thinking/speaking)

---

## Configuration

### Environment Variables (`.env.local`)

```bash
# HeyGen LiveAvatar API
HEYGEN_API_KEY=your_heygen_api_key_here

# OpenAI Realtime API
OPENAI_API_KEY=your_openai_api_key_here
```

### Avatar Configuration File (`config/avatar.config.ts`)

```typescript
export const avatarConfig = {
  // HeyGen Avatar Settings
  avatarId: 'dd73ea75-1218-4ef3-92ce-606d5f7fbc0a', // Placeholder - change as needed

  // OpenAI Settings
  openai: {
    model: 'gpt-4o-mini-realtime-preview',
    voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
  },

  // Kai Personality
  systemPrompt: `You are Kai, a helpful AI avatar who is happy to chat with people, answer any questions they have, or simply engage in a conversation. Be friendly, natural, and conversational.`,

  // Session Settings
  sessionTimeout: 300000, // 5 minutes in milliseconds
  language: 'en',
}
```

---

## User Interface Design

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Header: "Kai - AI Avatar"                      │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌───────────────────────────────────────┐    │
│   │                                        │    │
│   │     Avatar Video Stream (Main)        │    │
│   │                                        │    │
│   └───────────────────────────────────────┘    │
│                                                  │
│   ┌───────────────────────────────────────┐    │
│   │  Conversation History                  │    │
│   │  User: Hello!                          │    │
│   │  Kai: Hi! How can I help you today?   │    │
│   │  ...                                   │    │
│   └───────────────────────────────────────┘    │
│                                                  │
│   ┌───────────────────────────────────────┐    │
│   │  Text Input: [Type a message...]      │    │
│   └───────────────────────────────────────┘    │
│                                                  │
│   [Mute] [Interrupt] [Stop Session]            │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Design Principles

- **Dark Mode:** Default and only theme
- **Minimal UI:** Clean, uncluttered interface
- **Functional First:** Focus on usability over decoration
- **Responsive:** Works on desktop (primary target)

### UI Components

1. **Avatar Video Container**
   - Prominent position (top center)
   - 16:9 or 4:3 aspect ratio
   - WebRTC video element with LiveKit stream

2. **Conversation History Panel**
   - Scrollable transcript
   - User messages aligned left
   - Kai messages aligned right (or distinct styling)
   - Auto-scroll to latest message

3. **Text Input Field**
   - Simple input with send button
   - Enter key to send
   - Placeholder: "Type a message..."

4. **Control Buttons**
   - **Mute:** Toggle microphone on/off (visual indicator)
   - **Interrupt:** Stop avatar mid-speech
   - **Stop:** End session and return to start screen

---

## State Management Strategy

### Recommended Approach: Zustand

As the application manages multiple complex states (WebSocket connections, microphone status, avatar states, chat history, etc.), using a lightweight state management library is recommended over relying solely on React hooks and prop drilling.

**Why Zustand:**
- Lightweight and minimal API surface
- Integrates seamlessly with React hooks
- No context provider boilerplate
- TypeScript-friendly
- Easy to debug with DevTools support

**State to Manage:**
- Session connection states (HeyGen, OpenAI)
- User microphone mute status
- Avatar speaking/listening states
- Conversation history
- Error states and notifications
- Loading indicators

**Example Store Structure:**
```typescript
interface AppState {
  // Session states
  heygenConnected: boolean
  openaiConnected: boolean
  sessionActive: boolean

  // Audio states
  isMuted: boolean
  isUserTalking: boolean
  isAvatarSpeaking: boolean

  // Conversation
  messages: Message[]

  // Actions
  setMuted: (muted: boolean) => void
  addMessage: (message: Message) => void
  resetSession: () => void
}
```

**Alternative:** For developers preferring to stay minimal, custom hooks (`useKaiSession`, `useVoiceInput`, etc.) are acceptable, but may require more careful prop management as complexity grows.

---

## API Integration Details

### HeyGen LiveAvatar Integration

#### Session Creation

**Endpoint:** `POST /api/start-session`

**Request Flow:**
1. Frontend calls `/api/start-session`
2. Backend calls HeyGen API: `POST https://api.liveavatar.com/v1/sessions/token`
3. Backend receives `session_token` and `session_id`
4. Backend returns token to frontend
5. Frontend initializes LiveAvatar SDK with token

**Configuration:**
```json
{
  "mode": "CUSTOM",
  "avatar_id": "<from config file>"
}
```

#### WebSocket Events

**Events to Send:**
- `agent.speak` - Send audio chunks (Base64 PCM 16Bit 24KHz)
- `agent.speak_end` - Signal end of speech
- `agent.start_listening` - Avatar listening state
- `agent.stop_listening` - Avatar idle state
- `agent.interrupt` - Stop current speech
- `session.keep_alive` - Maintain session (every 4 minutes)

**Events to Receive:**
- `session.state_updated` - Session status (connecting, connected, closed)
- `agent.speak_started` - Avatar began speaking
- `agent.speak_ended` - Avatar finished speaking

### OpenAI Realtime API Integration (WebRTC)

The integration uses WebRTC for low-latency, bi-directional audio streaming. It does **not** use a simple WebSocket connection for the audio data.

#### Connection Handshake

**Endpoint:** `POST /v1/realtime/calls`

**Backend Proxy:** Direct calls to this endpoint cannot be made from the browser due to CORS and the need to keep the API key secret. A backend route (`/api/openai-call`) is used to proxy requests.

**Request Flow:**
1.  **Client:** Creates an `RTCPeerConnection` and generates an SDP offer.
2.  **Client to Backend:** `POST`s the SDP offer to `/api/openai-call`.
3.  **Backend to OpenAI:** Makes a `multipart/form-data` `POST` request to `https://api.openai.com/v1/realtime/calls`. The request body contains:
    *   `sdp`: The SDP offer from the client.
    *   `session`: A JSON string containing the session configuration (e.g., `{ "model": "...", "instructions": "..." }`).
4.  **OpenAI to Backend:** OpenAI responds with a JSON object containing the SDP `answer`.
5.  **Backend to Client:** The backend returns the SDP answer to the client.
6.  **Client:** Uses the SDP answer to complete the `RTCPeerConnection` handshake, establishing a direct media stream with OpenAI's servers.

#### Real-time Flow

1.  **User Audio Input** → Sent via the established WebRTC audio track.
2.  **OpenAI processes** → Returns text transcript and AI audio response via the WebRTC connection.
3.  **Client receives AI audio** → Forwards AI audio to the HeyGen WebSocket for lip-sync.
4.  **Avatar speaks** → User sees/hears response.

---

## Technical Requirements

### Browser Requirements

- Modern browser with WebRTC support
- Microphone access permission
- Audio playback capability
- JavaScript enabled

### System Requirements

- Node.js 18+ or 20+
- pnpm package manager
- Stable internet connection (for API calls and WebRTC streaming)

### API Requirements

- **HeyGen LiveAvatar Account:**
  - API key with CUSTOM mode access
  - Sufficient credits (1 credit = 1 minute CUSTOM mode)

- **OpenAI Account:**
  - API key with Realtime API access
  - GPT-4o model access

---

## Project Structure

```
avatar-demo/
├── app/
│   ├── api/
│   │   ├── heygen-session/
│   │   │   └── route.ts          # Create HeyGen session token
│   │   └── openai-call/
│   │       └── route.ts          # Proxy to OpenAI /v1/realtime/calls
│   ├── page.tsx                  # Main page (entry point)
│   └── ...                       # Other Next.js files
├── components/
│   ├── AvatarVideo.tsx           # Video display component
│   ├── ChatHistory.tsx           # Conversation transcript
│   ├── ControlPanel.tsx          # Mute/Interrupt/Stop buttons
│   ├── LandingPage.tsx           # Initial start page
│   └── TextInput.tsx             # Text chat input
├── lib/
│   ├── heygen/
│   │   └── session.ts            # HeyGen session management
│   ├── openai/
│   │   ├── webrtc.ts             # WebRTC client for OpenAI
│   │   └── audio.ts              # Audio processing utilities
│   └── hooks/
│       ├── useHeygenSession.ts   # Manages HeyGen connection
│       ├── useMicrophone.ts      # Captures user audio
│       ├── useOpenAI.ts          # Manages OpenAI WebRTC connection
│       └── useKaiSession.ts      # Main orchestration hook
├── config/
│   └── avatar.config.ts          # Avatar configuration file
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Example env file (committed)
├── package.json
└── ...                           # Other project files
```

---

## Development Setup

### Installation Steps

1. **Clone/Create Project**
   ```bash
   mkdir avatar-demo
   cd avatar-demo
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Configure Avatar Settings**
   ```bash
   # Edit src/config/avatar.config.ts
   # Set avatar ID, voice, and other preferences
   ```

5. **Run Development Server**
   ```bash
   pnpm dev
   ```

6. **Access Application**
   ```
   http://localhost:3000
   ```

### Required API Keys

- **HeyGen API Key:** Obtain from [https://liveavatar.com](https://liveavatar.com) settings
- **OpenAI API Key:** Obtain from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

## User Experience Flow

### Initial Load

1. User navigates to `http://localhost:3000`
2. Landing screen displays "Start Chat with Kai" button
3. User grants microphone permission when prompted

### Session Start

1. User clicks "Start Chat"
2. App creates HeyGen session (backend API call)
3. App establishes OpenAI Realtime WebSocket connection
4. Avatar video loads and displays
5. Kai greets user with initial message (optional)

### Conversation

**Voice Input:**
1. User speaks naturally
2. OpenAI Realtime API detects speech (automatic VAD)
3. OpenAI processes and generates response
4. Response audio sent to HeyGen
5. Avatar lip-syncs and speaks response
6. Transcript appears in chat history

**Text Input:**
1. User types message and presses Enter/Send
2. Text sent to OpenAI Realtime API
3. Same flow as voice (steps 3-6 above)

### User Controls

**Mute:**
- Click "Mute" button
- Microphone icon changes to indicate muted state
- User speech not captured until unmuted

**Interrupt:**
- Click "Interrupt" button while avatar is speaking
- Sends `agent.interrupt` to HeyGen WebSocket
- Avatar stops speaking immediately
- User can begin new input

**Stop:**
- Click "Stop" button
- Closes OpenAI WebSocket
- Ends HeyGen session
- Returns to landing screen
- Conversation history cleared

---

## Error Handling

### API Errors

- **HeyGen Session Creation Fails:** Display error message, prompt retry
- **OpenAI Connection Fails:** Display error message, fallback to text-only mode
- **WebSocket Disconnection:** Attempt automatic reconnection (3 retries), then show error

### User Experience Errors

- **No Microphone Permission:** Show message, enable text-only mode
- **Audio Playback Issues:** Display troubleshooting message
- **Session Timeout:** Notify user, offer to restart session

### Development Errors

- **Missing API Keys:** Clear error message in console and UI
- **Invalid Configuration:** Validate config on startup, show specific errors

---

## Performance Considerations

### Latency Optimization

- Use WebSocket connections for real-time communication
- Minimize audio chunk size for faster processing
- Leverage OpenAI Realtime API's server VAD for instant detection

### Resource Management

- Close WebSocket connections on session end
- Release microphone access when not needed
- Clean up event listeners on component unmount

### Credit Usage

- **HeyGen:** 1 credit per minute in CUSTOM mode
- **OpenAI:** Token-based pricing for Realtime API
- Monitor usage during development to avoid unexpected costs

---

## Testing Requirements

### Manual Testing Checklist

- [ ] Session starts successfully
- [ ] Avatar video displays correctly
- [ ] Voice input captured and transcribed
- [ ] Avatar responds with correct lip-sync
- [ ] Text input works as alternative
- [ ] Chat history displays accurately
- [ ] Mute button toggles microphone
- [ ] Interrupt button stops avatar
- [ ] Stop button ends session cleanly
- [ ] Dark mode styling appears correctly
- [ ] No console errors during normal operation

### Browser Testing

- Primary: Chrome/Edge (Chromium-based)
- Secondary: Firefox, Safari (best effort)

---

## Future Enhancements (Out of Scope for v1)

- Multiple avatar selection
- Conversation transcript export (PDF, TXT)
- Session persistence and history
- User authentication and profiles
- Analytics and usage tracking
- Custom system prompt editor (UI-based)
- Voice selection UI
- Mobile responsive design
- Deployment configuration (Vercel, AWS)
- Rate limiting and cost controls
- Advanced error recovery
- Connection quality indicators

---

## Security Considerations

### API Key Protection

- Store all API keys in `.env.local` (never commit)
- Use server-side API routes for sensitive operations
- Never expose API keys to client-side code

### User Privacy

- No conversation data stored server-side
- No user tracking or analytics (v1)
- Microphone access only when user grants permission

### Rate Limiting

- Consider implementing rate limits for API calls (future)
- Monitor API usage to prevent abuse

---

## Dependencies

### Core Dependencies

```json
{
  "next": "^15.4.2",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "@heygen/liveavatar-web-sdk": "workspace:*",
  "livekit-client": "^2.x.x",
  "openai": "^4.x.x",
  "zustand": "^5.0.2"
}
```

**Note:** `livekit-client` is used by the HeyGen SDK for WebRTC connections. Including it explicitly ensures transparent dependency management.

### Development Dependencies

```json
{
  "typescript": "^5.8.2",
  "eslint": "^9.31.0",
  "tailwindcss": "^3.4.17",
  "postcss": "^8.4.38",
  "autoprefixer": "^10.4.19"
}
```

---

## Success Criteria

The prototype is considered successful when:

✅ User can start a session and see Kai avatar
✅ User can speak naturally and receive real-time responses
✅ User can type messages and receive responses
✅ Avatar lip-sync matches speech accurately
✅ All control buttons (mute, interrupt, stop) work correctly
✅ Conversation history displays accurately
✅ Session runs for at least 5 minutes without issues
✅ Code is clean, documented, and easy to modify
✅ Setup instructions allow another developer to run locally

---

## Timeline & Milestones

**Target:** Minimal viable prototype for local testing

**Milestones:**
1. Project setup and configuration
2. HeyGen session integration
3. OpenAI Realtime API integration
4. UI implementation
5. Testing and refinement

**Note:** This is a prototype, not production software. Focus on functionality and learning over polish.

---

## References

- [HeyGen LiveAvatar Documentation](https://docs.liveavatar.com)
- [HeyGen LiveAvatar Web SDK Demo](https://github.com/heygen-com/liveavatar-web-sdk)
- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [LiveKit Documentation](https://docs.livekit.io)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Document Version

**Version:** 1.0
**Date:** 2025-12-25
**Author:** Generated via Claude Code
**Status:** Draft - Ready for Review
