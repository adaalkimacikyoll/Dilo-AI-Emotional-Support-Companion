# Dilo – AI Emotional Support Companion

![TypeScript](https://img.shields.io/badge/typescript-5.8-3178C6?logo=typescript)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/vite-6-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss)
![WebLLM](https://img.shields.io/badge/AI-on--device_WebLLM-5A4FCF)

Dilo is an AI emotional support companion. It listens without judgement, adapts to your mood, keeps a private journal, and points you to real, human help when a conversation signals risk.

**Privacy by design:** the AI runs entirely in your browser. Conversations, journal entries and notes never leave your device. There are no accounts, cookies, trackers or analytics.

> Dilo is not a psychologist or therapist and not a substitute for professional help. It is for adults (18+).

## Features

- **On-device AI.** An open-source model (Qwen3 1.7B, Apache 2.0) runs locally via WebGPU. It is downloaded once, only after the user explicitly agrees.
- **Two conversation styles.** *Friend* is casual and warm. *Psychological support* uses methods psychologists use (focused questions, reflection, pattern-spotting, CBT/ACT-informed techniques) without ever claiming to be a psychologist, diagnosing or commenting on medication.
- **Just listen, or listen and give tips.** Switch at any time.
- **Safety first.** A "Get help now" dialog is always one click away. A deterministic keyword check in 7 languages shows crisis lines under any message that signals risk, independent of the model; the model can flag risk too.
- **Journal.** Every conversation is saved and can be continued, deleted, or locked with its own password (AES-256-GCM, PBKDF2). Private journal entries and notes are never sent to the AI.
- **Consent first.** A blocking consent screen (18+, not a professional service, explicit consent for health-related data, privacy policy and terms) must be completed before anything else loads. Users can withdraw consent and delete everything in one click.
- **Legal pages** (Impressum, Datenschutzerklärung, Nutzungsbedingungen) in German and English.
- **Seven languages** with right-to-left layout for Arabic and Persian. Light, dark and system themes, three text sizes.

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript (strict) |
| Build | Vite 6, static site |
| Styling | Tailwind CSS 4, self-hosted fonts (Fontsource) |
| AI | WebLLM + Qwen3 1.7B (Apache 2.0) in a Web Worker |
| Encryption | Web Crypto API (PBKDF2 + AES-GCM) |
| Tests | Vitest |

## How it works

```
Browser only
────────────
consent screen ─▶ model setup (explicit download, cached afterwards)
text input ─▶ keyword crisis check ─▶ crisis lines if needed
          ─▶ system prompt (style, support type, mood, language, safety)
          ─▶ Qwen3 1.7B on WebGPU (Web Worker) ─▶ streamed reply
storage: localStorage (chats, journal, notes, settings, consent) + Cache Storage (model)
```

## Project structure

```
src/App.tsx                 consent wrapper, chat flow, model status, layout
src/components/             ConsentGate, LegalDialog, ModelSetup, ChatMessage, Composer, JournalView, ...
src/lib/api.ts              on-device model loading and chat
src/lib/prompt.ts           system prompt and crisis marker
src/lib/crisisDetect.ts     keyword safety net (7 languages)
src/lib/legal.ts            Impressum, privacy policy, terms (de/en)
src/lib/operator.ts         your name, address and email for the legal pages
src/lib/lock.ts             password encryption for locked conversations
public/models/              model library (wasm), served from our own domain
tests/                      unit tests
```

## Before publishing (checklist)

1. Fill in `src/lib/operator.ts` (name, address, email). `npm run check:legal` fails until you do.
2. Have the legal texts in `src/lib/legal.ts` reviewed by a lawyer.
3. Deploy on Vercel (free Hobby plan): import the repository at [vercel.com/new](https://vercel.com/new). No environment variables are needed.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000  (add ?mockAI to test without WebGPU)
```

On Windows PowerShell, if scripts are blocked, use `npm.cmd` instead of `npm`.

## Quality checks

```bash
npm run lint         # TypeScript, strict mode
npm test             # Vitest unit tests
npm run check:legal  # legal details filled in
npm run build
```

## Browser support

The on-device AI needs WebGPU and about 2 GB of free GPU memory: recent Chrome or Edge on desktop, Chrome on newer Android phones, and recent Safari versions with WebGPU. On other devices the journal and notes still work.

## The story behind it

Dilo's name comes from my cousin **Dilvin**, a psychology student who has always shown up for the people around her, especially on hard days. Her empathy and patience inspired every design decision in this app. I wanted to build something that carries even a small piece of what she naturally gives to everyone around her.

> Mental health support shouldn't feel clinical or out of reach. Dilo exists to bridge that gap.

## Roadmap

- [x] Crisis resource integration
- [x] Mood-aware replies
- [x] On-device AI, no server-side processing
- [ ] Conversation history across sessions and devices
- [ ] Therapist-reviewed response guidelines
- [ ] Mobile app (React Native)
