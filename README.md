# Dilo – AI Emotional Support Companion

![TypeScript](https://img.shields.io/badge/typescript-5.8-3178C6?logo=typescript)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/vite-6-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss)
![Gemini](https://img.shields.io/badge/AI-Gemini_API-4285F4?logo=google)

Dilo is an AI-powered emotional support chat app. It listens without judgement, adapts its tone to what you need, takes your current mood into account, and points you to real, human help when a conversation signals risk.

> Dilo is not a therapist and not a substitute for professional care. It is a supportive space to talk things through.

## Features

- **Two conversation styles.** *Friendly* is casual and warm. *Reflective* is calmer and more structured, using reflective listening and well-established self-help techniques. You can switch at any time.
- **Mood check-in.** Pick how you feel and Dilo factors it into its replies. Each mood also shows curated ideas for activities, food and drink, and other small steps.
- **Safety first.** A "Get help now" dialog is always one click away, with emergency guidance and verified crisis lines. When a message suggests risk, the model flags it and the app shows crisis resources directly under the reply.
- **Seven languages.** English, Turkish, German, French, Spanish, Arabic and Persian, with full right-to-left layout for Arabic and Persian.
- **Voice input.** Dictate messages using the browser's speech recognition, in the selected language.
- **Accessible preferences.** Light, dark or system theme, three text sizes, optional reply sound. Keyboard navigable, screen-reader labels, reduced-motion support.
- **Private by default.** Conversations and settings are stored only in your browser's local storage.

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| AI | Google Gemini API (`@google/genai`) |
| Markdown | react-markdown |

## How it works

```
User input (text or voice)
        ↓
Conversation style + selected mood + language
        ↓
System prompt  →  Gemini API
        ↓
Crisis marker check  →  inline crisis resources when flagged
        ↓
Markdown reply, rendered left-to-right or right-to-left
```

## Project structure

```
src/
  App.tsx                 app state, layout, chat flow
  components/             ChatMessage, Composer, MoodPicker, SettingsPanel, CrisisResources, Dialog, Logo
  hooks/                  usePersistentState, useSpeechInput
  lib/gemini.ts           model call, system prompt, error handling
  lib/translations.ts     all UI text and mood ideas, in 7 languages
  lib/crisis.ts           verified crisis lines
```

## Quick start

```bash
git clone https://github.com/adaalkimacikyoll/Dilo-AI-Emotional-Support-Companion
cd Dilo-AI-Emotional-Support-Companion
npm install
cp .env.example .env.local   # then add your key
npm run dev                  # http://localhost:3000
```

`.env.local`:

```
GEMINI_API_KEY=your_api_key_here
# optional, defaults to gemini-3.8-flash
GEMINI_MODEL=
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

> **Note:** in this client-only setup the key is bundled into the JavaScript sent to the browser. That is fine for local development, but before deploying publicly, move the Gemini call behind a server or serverless function so the key stays secret.

## The story behind it

Dilo's name comes from my cousin **Dilvin**, a psychology student who has always shown up for the people around her, especially on hard days. Her empathy and patience inspired every design decision in this app. I wanted to build something that carries even a small piece of what she naturally gives to everyone around her.

> Mental health support shouldn't feel clinical or out of reach. Dilo exists to bridge that gap.

## Roadmap

- [x] Crisis resource integration
- [x] Mood-aware replies
- [ ] Server-side API proxy for production deployment
- [ ] Conversation history across sessions and devices
- [ ] Therapist-reviewed response guidelines
- [ ] Mobile app (React Native)
