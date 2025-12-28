# Kai Avatar Implementation Plan

## Overview

This document outlines the incremental development plan for the Kai Avatar prototype. Each phase follows professional development practices including feature branching, code review checkpoints, testing, commits, and GitHub integration.

---

## Prerequisites

### Before Starting Development

- [ ] GitHub repository created and initialized
- [ ] Main branch protected (require PR reviews)
- [ ] API keys obtained:
  - [ ] HeyGen LiveAvatar API key
  - [ ] OpenAI API key
- [ ] Development environment configured:
  - [ ] Node.js 18+ or 20+ installed
  - [ ] pnpm installed globally
  - [ ] Git configured with user info

### Initial Repository Setup

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Project structure"

# Create GitHub repository and push
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main

# Set up branch protection rules on GitHub
# - Require pull request reviews before merging
# - Require status checks to pass
```

---

## Development Phases

### Phase 0: Project Foundation

**Branch:** `feature/project-setup`

#### Tasks

1. **Initialize Next.js Project**
   ```bash
   git checkout -b feature/project-setup
   pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir
   ```

2. **Install Core Dependencies**
   ```bash
   pnpm add zustand livekit-client openai
   pnpm add -D @types/node
   ```

3. **Configure Project Structure**
   - Create directory structure:
     ```
     app/
     ├── api/
     ├── page.tsx
     ├── layout.tsx
     └── globals.css
     components/
     lib/
     ├── heygen/
     ├── openai/
     ├── hooks/
     └── stores/
     config/
     test/
     ```

   **Note on Directory Structure:**
   This plan uses `lib/` to contain stores and hooks, following a common Next.js pattern where `lib/` houses reusable library code. An alternative modern convention is to use top-level `hooks/`, `stores/`, or `components/` directories. Both approaches are valid - choose based on team preference. This plan maintains consistency with the `lib/` pattern throughout.

4. **Set Up Environment Variables**
   - Create `.env.local` (add to `.gitignore`)
   - Create `.env.example` template:
     ```bash
     HEYGEN_API_KEY=your_heygen_api_key_here
     OPENAI_API_KEY=your_openai_api_key_here
     ```

5. **Create Avatar Configuration File**
   - Create `config/avatar.config.ts` with default values

6. **Configure Tailwind for Dark Mode**
   - Update `tailwind.config.ts` with dark mode settings
   - Set up base dark mode styles in `globals.css`

7. **Set Up Testing Framework**
   - Install testing dependencies:
     ```bash
     pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
     ```
   - Create `vitest.config.ts`:
     ```typescript
     import { defineConfig } from 'vitest/config'
     import react from '@vitejs/plugin-react'
     import path from 'path'

     export default defineConfig({
       plugins: [react()],
       test: {
         environment: 'jsdom',
         globals: true,
         setupFiles: ['./test/setup.ts'],
       },
       resolve: {
         alias: {
           '@': path.resolve(__dirname, './'),
         },
       },
     })
     ```
   - Create `test/setup.ts`:
     ```typescript
     import '@testing-library/jest-dom'
     ```
   - Add test scripts to `package.json`:
     ```json
     {
       "scripts": {
         "test": "vitest",
         "test:watch": "vitest --watch",
         "test:coverage": "vitest --coverage"
       }
     }
     ```

#### Tests

- [ ] `pnpm dev` starts development server successfully
- [ ] Navigate to `http://localhost:3000` shows default Next.js page
- [ ] Environment variables load correctly (verify with console.log)
- [ ] Dark mode styling appears correctly
- [ ] `pnpm test` runs successfully (even with no tests yet)
- [ ] Testing framework configured correctly

#### Code Review Checkpoint

**Self-Review Checklist:**
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.example` contains placeholder values (no real keys)
- [ ] `package.json` includes all required dependencies
- [ ] Directory structure matches spec
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No ESLint errors (`pnpm lint`)

#### Commit & Push

```bash
git add .
git commit -m "feat: Initialize Next.js project with dependencies and config

- Set up Next.js 15 with TypeScript and Tailwind CSS
- Install core dependencies: zustand, livekit-client, openai
- Create project directory structure
- Configure environment variables template
- Set up avatar configuration file
- Configure dark mode styling
- Set up Vitest testing framework with React Testing Library"

git push origin feature/project-setup
```

#### Create Pull Request

- Open PR on GitHub: `feature/project-setup` → `main`
- Review changes in GitHub UI
- Merge PR after review
- Delete feature branch
- Pull latest main locally

---

### Phase 1: HeyGen Session Management

**Branch:** `feature/heygen-session`

#### Tasks

1. **Create HeyGen API Route - Start Session**
   - File: `app/api/start-session/route.ts`
   - Implement POST endpoint
   - Call HeyGen API to create session token
   - Handle errors and validation

2. **Create HeyGen API Route - Stop Session**
   - File: `app/api/stop-session/route.ts`
   - Implement POST endpoint
   - End HeyGen session gracefully

3. **Create HeyGen API Route - Keep Alive**
   - File: `app/api/keep-session-alive/route.ts`
   - Implement POST endpoint for session maintenance

4. **Create HeyGen Utility Functions**
   - File: `lib/heygen/session.ts`
   - Session creation helper
   - Session validation
   - Error handling utilities

5. **Create HeyGen Types**
   - File: `lib/heygen/types.ts`
   - TypeScript interfaces for HeyGen API responses
   - Session state types

#### Tests

**Manual API Testing (use Postman or curl):**

```bash
# Test start-session
curl -X POST http://localhost:3000/api/start-session \
  -H "Content-Type: application/json"

# Expected: Returns session_token and session_id

# Test stop-session
curl -X POST http://localhost:3000/api/stop-session \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-session-id"}'

# Expected: Returns success confirmation
```

**Test Checklist:**
- [ ] Start session endpoint returns valid token
- [ ] Stop session endpoint returns success
- [ ] Keep-alive endpoint extends session
- [ ] Error handling works (invalid API key, network errors)
- [ ] TypeScript types are correct with no errors

#### Code Review Checkpoint

**Self-Review Checklist:**
- [ ] API keys are accessed from environment variables only
- [ ] Error responses include helpful messages
- [ ] HTTP status codes are appropriate (200, 400, 500)
- [ ] All functions have proper TypeScript typing
- [ ] No sensitive data logged to console
- [ ] Code follows project naming conventions
- [ ] No unused imports or variables

#### Commit & Push

```bash
git add .
git commit -m "feat: Implement HeyGen session management API routes

- Create /api/start-session endpoint
- Create /api/stop-session endpoint
- Create /api/keep-session-alive endpoint
- Add HeyGen utility functions and types
- Implement error handling for API calls"

git push origin feature/heygen-session
```

#### Create Pull Request

- Open PR: `feature/heygen-session` → `main`
- Add description of changes and testing performed
- Self-review code in GitHub UI
- Merge after review
- Delete branch and pull latest main

---

### Phase 2: State Management with Zustand

**Branch:** `feature/state-management`

#### Tasks

1. **Create App State Store**
   - File: `lib/stores/useAppStore.ts`
   - Define state interface
   - Implement session state management
   - Implement audio state management (mute, talking states)
   - Implement conversation history management

2. **Create Store Types**
   - File: `lib/stores/types.ts`
   - Message type interface
   - Session state enums
   - Store action types

3. **Add DevTools Support (Development Only)**
   - Configure Zustand DevTools for debugging
   - Only enable in development mode

#### Example Store Structure

```typescript
// lib/stores/useAppStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AppState {
  // Session states
  heygenSessionId: string | null
  heygenConnected: boolean
  openaiConnected: boolean
  sessionActive: boolean

  // Audio states
  isMuted: boolean
  isUserTalking: boolean
  isAvatarSpeaking: boolean

  // Conversation
  messages: Message[]

  // Error state
  error: string | null

  // Actions
  setHeygenSession: (sessionId: string) => void
  setHeygenConnected: (connected: boolean) => void
  setOpenaiConnected: (connected: boolean) => void
  setSessionActive: (active: boolean) => void
  setMuted: (muted: boolean) => void
  setUserTalking: (talking: boolean) => void
  setAvatarSpeaking: (speaking: boolean) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setError: (error: string | null) => void
  resetSession: () => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Initial state
      heygenSessionId: null,
      heygenConnected: false,
      openaiConnected: false,
      sessionActive: false,
      isMuted: false,
      isUserTalking: false,
      isAvatarSpeaking: false,
      messages: [],
      error: null,

      // Actions
      setHeygenSession: (sessionId) => set({ heygenSessionId: sessionId }),
      setHeygenConnected: (connected) => set({ heygenConnected: connected }),
      setOpenaiConnected: (connected) => set({ openaiConnected: connected }),
      setSessionActive: (active) => set({ sessionActive: active }),
      setMuted: (muted) => set({ isMuted: muted }),
      setUserTalking: (talking) => set({ isUserTalking: talking }),
      setAvatarSpeaking: (speaking) => set({ isAvatarSpeaking: speaking }),

      addMessage: (message) => set((state) => ({
        messages: [
          ...state.messages,
          {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          },
        ],
      })),

      clearMessages: () => set({ messages: [] }),
      setError: (error) => set({ error }),

      resetSession: () => set({
        heygenSessionId: null,
        heygenConnected: false,
        openaiConnected: false,
        sessionActive: false,
        isMuted: false,
        isUserTalking: false,
        isAvatarSpeaking: false,
        messages: [],
        error: null,
      }),
    }),
    { name: 'KaiAvatarStore' }
  )
)
```

#### Tests

**Unit Tests (Create `lib/stores/__tests__/useAppStore.test.ts`):**

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '../useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAppStore())
    act(() => {
      result.current.resetSession()
    })
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAppStore())
    expect(result.current.sessionActive).toBe(false)
    expect(result.current.messages).toEqual([])
  })

  it('should add messages correctly', () => {
    const { result } = renderHook(() => useAppStore())
    act(() => {
      result.current.addMessage({ role: 'user', content: 'Hello' })
    })
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].content).toBe('Hello')
  })

  // Add more tests...
})
```

**Manual Testing:**
- [ ] Store state updates correctly
- [ ] DevTools show state changes in browser
- [ ] State persists across component re-renders
- [ ] resetSession() clears all state

#### Code Review Checkpoint

**Self-Review Checklist:**
- [ ] All state properties have proper TypeScript types
- [ ] Actions follow naming conventions (set*, add*, clear*)
- [ ] DevTools only enabled in development
- [ ] No business logic in store (keep it simple)
- [ ] Store is exported correctly for component use

#### Commit & Push

```bash
git add .
git commit -m "feat: Implement Zustand state management store

- Create global app state store with Zustand
- Define session, audio, and conversation states
- Implement state actions and mutations
- Add TypeScript types for store
- Configure Zustand DevTools for debugging
- Add unit tests for store functionality"

git push origin feature/state-management
```

#### Create Pull Request

- Open PR: `feature/state-management` → `main`
- Merge after review
- Delete branch and pull latest main

---

### Phase 3: Basic UI Components

**Branch:** `feature/ui-components`

#### Tasks

1. **Create Landing Page Component**
   - File: `components/LandingPage.tsx`
   - "Start Chat with Kai" button
   - Simple dark mode layout
   - Microphone permission request

2. **Create Avatar Video Component**
   - File: `components/AvatarVideo.tsx`
   - Video element for WebRTC stream
   - Placeholder for when video not loaded
   - Responsive container

3. **Create Chat History Component**
   - File: `components/ChatHistory.tsx`
   - Display messages from Zustand store
   - Auto-scroll to latest message
   - User/Assistant message styling

4. **Create Text Input Component**
   - File: `components/TextInput.tsx`
   - Input field with send button
   - Enter key to send
   - Disabled state during processing

5. **Create Control Panel Component**
   - File: `components/ControlPanel.tsx`
   - Mute button with toggle state
   - Interrupt button
   - Stop session button
   - Button states (enabled/disabled)

6. **Update Main Page**
   - File: `app/page.tsx`
   - Conditional rendering (landing vs session)
   - Integrate components
   - Connect to Zustand store

7. **Update Global Styles**
   - File: `app/globals.css`
   - Dark mode color palette
   - Button styles
   - Message bubble styles

#### Tests

**Visual Testing Checklist:**
- [ ] Landing page displays correctly
- [ ] "Start Chat" button is clickable
- [ ] Avatar video container has proper aspect ratio
- [ ] Chat history scrolls correctly
- [ ] Text input accepts typing
- [ ] Send button is visible and styled
- [ ] Control buttons display with correct icons/labels
- [ ] Dark mode colors are applied throughout
- [ ] Layout is responsive (test window resize)

**Component Testing (Create tests in `components/__tests__/`):**

```typescript
// components/__tests__/ChatHistory.test.tsx
import { render, screen } from '@testing-library/react'
import ChatHistory from '../ChatHistory'

describe('ChatHistory', () => {
  it('renders messages correctly', () => {
    // Test implementation
  })

  it('auto-scrolls to latest message', () => {
    // Test implementation
  })
})
```

#### Code Review Checkpoint

**Self-Review Checklist:**
- [ ] All components use TypeScript with proper types
- [ ] Components are properly exported
- [ ] No hardcoded values (use config file)
- [ ] Accessible HTML (buttons, inputs have labels)
- [ ] Dark mode colors consistent
- [ ] No console errors or warnings
- [ ] Components are reusable and composable

#### Commit & Push

```bash
git add .
git commit -m "feat: Create basic UI components with dark mode

- Create LandingPage component
- Create AvatarVideo component with video container
- Create ChatHistory component with auto-scroll
- Create TextInput component with send button
- Create ControlPanel with mute/interrupt/stop buttons
- Update main page with conditional rendering
- Style components with dark mode Tailwind classes
- Add component tests"

git push origin feature/ui-components
```

#### Create Pull Request

- Open PR: `feature/ui-components` → `main`
- Include screenshots of UI in PR description
- Merge after review
- Delete branch and pull latest main

---

### Phase 4: HeyGen WebSocket Integration

**Branch:** `feature/heygen-websocket`

#### Tasks

1. **Create HeyGen WebSocket Manager**
   - File: `lib/heygen/websocket.ts`
   - WebSocket connection management
   - Event handlers (state_updated, speak_started, speak_ended)
   - Send command events (speak, interrupt, start_listening, etc.)
   - Automatic reconnection logic

2. **Create Custom Hook - useHeygenSession**
   - File: `lib/hooks/useHeygenSession.ts`
   - Initialize HeyGen session
   - Connect to WebSocket
   - Manage session lifecycle
   - Expose session controls

3. **Integrate LiveAvatar SDK**
   - Install `@heygen/liveavatar-web-sdk`
   - Create wrapper around SDK
   - Handle video stream attachment

4. **Update Avatar Video Component**
   - Connect to HeyGen session
   - Attach video element to stream
   - Show loading state

5. **Update Control Panel**
   - Connect interrupt button to HeyGen
   - Connect stop button to session management

#### Tests

**Integration Testing:**

```typescript
// lib/heygen/__tests__/websocket.test.ts
describe('HeyGen WebSocket Manager', () => {
  it('connects to WebSocket successfully', async () => {
    // Mock WebSocket
    // Test connection
  })

  it('handles state_updated events', () => {
    // Test event handling
  })

  it('sends agent.speak events correctly', () => {
    // Test sending events
  })
})
```

**Manual Testing:**
- [ ] Start session creates HeyGen connection
- [ ] Video stream appears in video element
- [ ] WebSocket events logged to console
- [ ] Interrupt button sends interrupt event
- [ ] Stop button closes session cleanly
- [ ] Session state updates in Zustand store
- [ ] No WebSocket errors in console

#### Code Review Checkpoint

**Self-Review Checklist:**
- [ ] WebSocket cleanup on unmount
- [ ] Error handling for connection failures
- [ ] Reconnection logic works correctly
- [ ] No memory leaks (event listeners removed)
- [ ] TypeScript types for all events
- [ ] Zustand store updated with session state

#### Commit & Push

```bash
git add .
git commit -m "feat: Integrate HeyGen WebSocket and LiveAvatar SDK

- Create HeyGen WebSocket manager with event handling
- Implement useHeygenSession custom hook
- Integrate LiveAvatar SDK for video streaming
- Connect video component to HeyGen stream
- Wire up control buttons to HeyGen commands
- Add WebSocket reconnection logic
- Update state store with HeyGen session state"

git push origin feature/heygen-websocket
```

#### Create Pull Request

- Open PR: `feature/heygen-websocket` → `main`
- Merge after review
- Delete branch and pull latest main

---

### Phase 5: OpenAI WebRTC Integration

**Branch:** `feature/openai-webrtc`

**Note:** This is a major architectural change. This phase replaces the old WebSocket-based approach with the correct WebRTC implementation required by the OpenAI Realtime API. This new architecture is inherently secure, making the old "Phase 6" obsolete.

#### Tasks

1.  **Rename and Update Backend API Route**
    -   Rename `app/api/openai-token/` to `app/api/openai-call/`.
    -   Update the route to accept a `POST` request with a JSON body containing an `sdp` offer string.
    -   It will then make a `multipart/form-data` request to OpenAI's `POST /v1/realtime/calls` endpoint.
    -   The `sdp` offer and the session configuration (`model`, `instructions`) will be sent in this request.
    -   It will parse the SDP `answer` from OpenAI's response and return it to the client.

2.  **Create WebRTC Client**
    -   Create a new `lib/openai/webrtc.ts` file.
    -   This file will contain a class or set of functions to manage the `RTCPeerConnection`.
    -   Responsibilities:
        -   Creating and configuring the `RTCPeerConnection`.
        -   Handling ICE candidate events (`onicecandidate`).
        -   Creating the initial SDP offer (`createOffer`).
        -   Setting the local and remote SDP descriptions (`setLocalDescription`, `setRemoteDescription`).
        -   Managing audio tracks for sending microphone data and receiving AI responses.

3.  **Update `useOpenAIRealtime` Hook**
    -   Rename to `useOpenAIWebRTC.ts` for clarity.
    -   Remove all old WebSocket logic.
    -   Use the new WebRTC client from `webrtc.ts`.
    -   Orchestrate the handshake:
        1.  Create the WebRTC client.
        2.  Generate the SDP offer.
        3.  `POST` the offer to `/api/openai-call`.
        4.  Receive the SDP answer and set it on the peer connection.
    -   Handle incoming audio tracks from the peer connection.

4.  **Update `useKaiSession` Hook**
    -   Integrate the new `useOpenAIWebRTC` hook.
    -   The `onAudioData` from the microphone now needs to be routed to the outgoing WebRTC audio track.
    -   The incoming AI audio track from the WebRTC connection needs to be routed to the `useHeygenSession` hook's `repeatAudio` function.

5.  **Update `useMicrophone` Hook**
    -   Ensure the audio stream provided by the microphone is compatible with being added to a WebRTC track. (The current implementation should be fine).

#### Tests

**Manual Testing:**
- [ ] `POST` to `/api/openai-call` successfully returns an SDP answer.
- [ ] `RTCPeerConnection` state changes to `connected`.
- [ ] Audio from the microphone is successfully sent over the peer connection.
- [ ] Audio is received from OpenAI on the remote track.
- [ ] Avatar lip-syncs to the audio received from OpenAI.

**Integration Tests (Mocks Required):**
- [ ] Test that the `useOpenAIWebRTC` hook correctly performs the offer/answer handshake.
- [ ] Test the `useKaiSession` hook to ensure it correctly routes audio between the microphone, WebRTC, and HeyGen hooks.

---

### Phase 6: Text Chat & Control Features (Consolidated)

**Branch:** `feature/controls-and-text-chat`

#### Tasks

1.  **Implement Text Chat**
    -   Determine how to send text input. **Assumption:** The best approach is to use a Text-to-Speech (TTS) service (like OpenAI's `v1/audio/speech` API, or a browser-based one) to convert the text to audio, then send that audio through the existing WebRTC connection. This keeps the data flow consistent.
    -   Create a new API route or client-side logic to handle the TTS conversion.
    -   Update the `TextInput` component to use this new logic.

2.  **Integrate Control Features**
    -   Wire up the `Mute` button in `ControlPanel` to the `useMicrophone` hook's `toggleMute` function.
    -   Wire up the `Interrupt` button to the `interrupt` functions on both the OpenAI and HeyGen hooks.
    -   Ensure the `Stop` button correctly tears down the WebRTC connection in addition to the HeyGen session.

#### Tests

- [ ] Typing a message results in the avatar speaking the response.
- [ ] Mute button correctly stops audio from being sent to OpenAI.
- [ ] Interrupt button stops both the user's audio processing and the avatar's speech.
- [ ] Stop button cleanly closes all connections and resets the UI.

---

### Phase 7: Final Testing & Bug Fixes (Renumbered)

**Branch:** `bugfix/final-testing`

(Tasks remain the same as the original Phase 9)

---

### Phase 8: Documentation & README (Renumbered)

**Branch:** `docs/final-documentation`

(Tasks remain the same as the original Phase 10)

---

## Release

### Version 1.0 - Prototype Complete

**Tag:** `v1.0.0-prototype`

#### Release Tasks

1. **Create Release Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b release/v1.0.0
   ```

2. **Final Testing**
   - [ ] Run all tests
   - [ ] Full manual test of all features
   - [ ] Verify documentation accuracy

3. **Update Version**
   - Update `package.json` version to `1.0.0`
   - Create `CHANGELOG.md` with all features

4. **Create Release Commit**
   ```bash
   git add .
   git commit -m "chore: Release v1.0.0 - Kai Avatar Prototype

   Features:
   - Real-time voice conversation with OpenAI Realtime API
   - HeyGen LiveAvatar integration with lip-sync
   - Text chat alternative
   - Conversation history display
   - Mute/Interrupt/Stop controls
   - Dark mode UI
   - State management with Zustand
   - Secure token-based authentication

   See CHANGELOG.md for full details."
   ```

5. **Merge to Main**
   ```bash
   git push origin release/v1.0.0
   # Create PR and merge to main
   ```

6. **Tag Release**
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Kai Avatar Prototype v1.0.0"
   git push origin v1.0.0
   ```

7. **Create GitHub Release**
   - Go to GitHub Releases
   - Create new release from tag `v1.0.0`
   - Title: "Kai Avatar Prototype v1.0.0"
   - Description: Copy from CHANGELOG.md
   - Mark as "pre-release" (since it's a prototype)

---

## Post-Release

### Immediate Next Steps

1. **Demo & Testing**
   - [ ] Test prototype with real users
   - [ ] Gather feedback
   - [ ] Document issues in GitHub

2. **Plan Next Iteration**
   - [ ] Review spec.md "Future Enhancements"
   - [ ] Prioritize features based on feedback
   - [ ] Create new plan.md for v2.0

3. **Maintenance**
   - [ ] Monitor GitHub issues
   - [ ] Update dependencies regularly
   - [ ] Address critical bugs promptly

---

## Development Best Practices Summary

### Git Workflow

1. **Always work on feature branches**
   - Never commit directly to `main`
   - Branch naming: `feature/`, `bugfix/`, `docs/`

2. **Commit messages follow conventional commits**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `chore:` - Maintenance
   - `refactor:` - Code refactoring
   - `test:` - Adding tests

3. **Pull requests require review**
   - Self-review in GitHub UI
   - Check all files changed
   - Verify no debug code or console.logs

4. **Keep branches up to date**
   - Regularly pull from main
   - Rebase if needed
   - Resolve conflicts promptly

### Code Quality

1. **TypeScript strict mode**
   - No `any` types unless absolutely necessary
   - Proper interface definitions
   - Type all function parameters and returns

2. **ESLint & Prettier**
   - Run `pnpm lint` before committing
   - Fix all warnings
   - Consistent code formatting

3. **Testing**
   - Test new features manually
   - Write tests for critical functionality
   - Run tests before merging

4. **Security**
   - Never commit `.env.local`
   - No API keys in code
   - Validate all user inputs

### Performance

1. **Bundle size**
   - Monitor with `next build`
   - Lazy load components if needed
   - Optimize images (if added)

2. **Memory management**
   - Clean up WebSocket connections
   - Release microphone on unmount
   - Clear timers and intervals

3. **State updates**
   - Avoid unnecessary re-renders
   - Use Zustand selectors wisely
   - Batch state updates when possible

---

## Troubleshooting Common Issues

### Issue: Session won't start

**Possible causes:**
- Invalid API keys
- Network connectivity
- CORS issues

**Debug steps:**
1. Check `.env.local` has correct keys
2. Check browser console for errors
3. Check Network tab for failed requests
4. Verify API keys are valid in respective dashboards

### Issue: No audio from avatar

**Possible causes:**
- OpenAI not sending audio
- Audio not forwarded to HeyGen
- Browser audio permissions

**Debug steps:**
1. Check OpenAI WebSocket events in console
2. Verify audio data is Base64 PCM
3. Check HeyGen WebSocket sends agent.speak
4. Check browser audio not muted

### Issue: Microphone not working

**Possible causes:**
- Permission denied
- Wrong device selected
- Browser compatibility

**Debug steps:**
1. Check browser permissions
2. Test microphone in browser settings
3. Try different browser
4. Check console for errors

### Issue: Memory leak / Performance degradation

**Possible causes:**
- WebSocket not closed
- Timers not cleared
- Event listeners not removed

**Debug steps:**
1. Use Chrome DevTools Memory profiler
2. Check for detached DOM nodes
3. Verify cleanup in useEffect
4. Check WebSocket close on unmount

---

## Success Criteria

### Prototype is considered successful when:

✅ **Core Functionality:**
- [ ] User can start a session
- [ ] User can speak and receive responses
- [ ] User can type and receive responses
- [ ] Avatar video displays with lip-sync
- [ ] All controls work (mute, interrupt, stop)

✅ **Code Quality:**
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Tests passing
- [ ] Code reviewed and merged

✅ **Documentation:**
- [ ] README.md complete
- [ ] Setup instructions clear
- [ ] Code commented appropriately

✅ **Performance:**
- [ ] No memory leaks
- [ ] Acceptable latency (<2 seconds response)
- [ ] Stable for 5+ minute conversations

✅ **Security:**
- [ ] API keys not exposed client-side
- [ ] Environment variables configured correctly
- [ ] No sensitive data in git history

---

## Timeline Estimate

**Total Estimated Time:** 40-60 hours (5-8 days for solo developer)

**Phase Breakdown:**
- Phase 0: Project Setup - 2-3 hours
- Phase 1: HeyGen Session - 3-4 hours
- Phase 2: State Management - 2-3 hours
- Phase 3: UI Components - 4-6 hours
- Phase 4: HeyGen WebSocket - 5-7 hours
- Phase 5: OpenAI Realtime - 8-10 hours (most complex)
- Phase 6: Token Security - 3-4 hours
- Phase 7: Text Chat - 2-3 hours
- Phase 8: Controls & Polish - 4-5 hours
- Phase 9: Testing & Bugs - 6-8 hours
- Phase 10: Documentation - 3-4 hours

**Note:** Times are estimates and may vary based on:
- Familiarity with technologies
- API quirks and unexpected issues
- Debugging time
- Testing thoroughness

---

## Appendix

### Useful Commands Reference

```bash
# Development
pnpm dev                 # Start dev server
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint
pnpm typecheck          # Run TypeScript check

# Git
git status              # Check status
git log --oneline       # View commit history
git branch              # List branches
git checkout -b <name>  # Create new branch
git add .               # Stage changes
git commit -m "message" # Commit changes
git push origin <branch> # Push to remote

# Testing
pnpm test               # Run tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Generate coverage report
```

### API Endpoints Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/start-session` | POST | Create HeyGen session |
| `/api/stop-session` | POST | End HeyGen session |
| `/api/keep-session-alive` | POST | Extend session timeout |
| `/api/get-openai-token` | GET | Get OpenAI ephemeral token |

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [HeyGen LiveAvatar Docs](https://docs.liveavatar.com)
- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [LiveKit Documentation](https://docs.livekit.io)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-25
**Status:** Ready for Implementation
