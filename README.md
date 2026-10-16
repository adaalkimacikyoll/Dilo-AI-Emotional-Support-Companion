# Dilo – AI Emotional Support Companion

![TypeScript](https://img.shields.io/badge/typescript-5.8-3178C6?logo=typescript)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/vite-6-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss)
![Gemini](https://img.shields.io/badge/AI-Gemini_API-4285F4?logo=google)

Dilo is an AI-powered emotional support chat app. It listens without judgement, adapts its tone to what you need, takes your current mood into account, and points you to real, human help when a conversation signals risk.

> Dilo is not a therapist and not a substitute for professional care. It is a supportive space to talk things through.

## Features

- **Two conversation styles.** *Friend* is casual and warm. *Psychologist* works the way a psychologist does in a session: focused questions, reflection, pattern-spotting and evidence-based techniques (CBT, ACT, motivational interviewing). It is still an AI, so it never claims a licence, diagnoses or comments on medication. You can switch at any time.
- **Just listen, or listen and give tips.** Choose at any point whether Dilo should only listen and reflect, or also suggest things that might help.
- **Journal.** Every conversation is saved and can be continued, deleted, or locked with its own password (encrypted on the device). Private journal entries and notes are never sent to the AI.
- **Mood check-in.** Pick how you feel and Dilo factors it into its replies. Each mood also shows curated ideas for activities, food and drink, and other small steps.
- **Safety first.** A "Get help now" dialog is always one click away, with emergency guidance and verified crisis lines. When a message suggests risk, the model flags it and the app shows crisis resources directly under the reply.
- **Seven languages.** English, Turkish, German, French, Spanish, Arabic and Persian, with full right-to-left layout for Arabic and Persian.
- **Voice input.** Dictate messages using the browser's speech recognition, in the selected language.
- **Accessible preferences.** Light, dark or system theme, three text sizes, optional reply sound. Keyboard navigable, screen-reader labels, reduced-motion support.
- **Private by default.** Conversations and settings are stored only in your browser's local storage.

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript (strict) |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| API | Vercel Function (`api/chat.ts`), shared with the Vite dev server |
| AI | Google Gemini API (`@google/genai`), called only on the server |
| Tests | Vitest |

## How it works

```
Browser (React)                         Server (Vercel Function / Vite dev middleware)
───────────────                         ─────────────────────────────────────────────
text or voice input
mood, style, language     ── POST /api/chat ──▶  validate + rate limit
recent history (trimmed)                         system prompt (style, mood, language, safety)
                                                 Gemini API  (key stays here)
reply + crisis flag       ◀──── JSON ─────────   crisis marker detection
inline crisis lines if flagged
```

## Project structure

```
api/chat.ts               Vercel Function entry point
server/chat.ts            request validation, rate limiting, Gemini call, error mapping
server/prompt.ts          system prompt and crisis marker handling
shared/chat-types.ts      types and limits used by both sides
src/App.tsx               app state, layout, chat flow
src/components/           ChatMessage, Composer, MoodPicker, SettingsPanel, CrisisResources, Dialog, Logo
src/hooks/                usePersistentState, useSpeechInput
src/lib/api.ts            client for /api/chat
src/lib/translations.ts   all UI text and mood ideas, in 7 languages
src/lib/crisis.ts         verified crisis lines
tests/                    unit tests for the server logic
```

## Deploy on Vercel (free Hobby plan)

1. Import this repository at [vercel.com/new](https://vercel.com/new). Vercel detects Vite automatically.
2. In **Settings → Environment Variables**, add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`).
3. Deploy. Every pull request gets its own preview URL.

The key is only read by the function in `api/chat.ts`; it is never sent to the browser.

## Run locally

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

On Windows PowerShell, if scripts are blocked, use `npm.cmd` instead of `npm`.

## Quality checks

```bash
npm run lint    # TypeScript, strict mode
npm test        # Vitest unit tests
npm run build
```

## The story behind it

Dilo's name comes from my cousin **Dilvin**, a psychology student who has always shown up for the people around her, especially on hard days. Her empathy and patience inspired every design decision in this app. I wanted to build something that carries even a small piece of what she naturally gives to everyone around her.

> Mental health support shouldn't feel clinical or out of reach. Dilo exists to bridge that gap.

## Roadmap

- [x] Crisis resource integration
- [x] Mood-aware replies
- [x] Server-side API proxy for production deployment
- [ ] Conversation history across sessions and devices
- [ ] Therapist-reviewed response guidelines
- [ ] Mobile app (React Native)
