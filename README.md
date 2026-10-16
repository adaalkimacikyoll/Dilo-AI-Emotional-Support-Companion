# Dilo – AI Emotional Support Companion

![TypeScript](https://img.shields.io/badge/typescript-5.8-3178C6?logo=typescript)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/vite-6-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss)
![AI](https://img.shields.io/badge/AI-EU--hosted_(Scaleway)-5A4FCF)

Dilo is an AI emotional support companion. It listens without judgement, adapts to your mood, keeps a private journal, and points you to real, human help when a conversation signals risk.

**Privacy by design:** no cookies, trackers or analytics. Accounts, conversations, journal entries and notes are stored encrypted on the device. To generate a reply, the current conversation is sent through a Vercel function (Frankfurt) to an AI model hosted in the EU (Scaleway, Paris) and is not used for training. Journal entries and notes never leave the device.

> Dilo is not a psychologist or therapist and not a substitute for professional help. It is for adults (18+).

## Features

- **Fast replies on every device.** Replies stream in from an EU-hosted model (Gemma 4 via Scaleway Generative APIs, Paris). The API key stays on the server.
- **Two clearly different conversation styles.** *Friend* talks like a warm, caring best friend. *Psychological support* uses methods psychologists use (focused questions, reflection, pattern-spotting, CBT/ACT-informed techniques) without ever claiming to be a psychologist, diagnosing or commenting on medication.
- **Modes menu in the navbar.** Conversation style (Friend / Psychological support) and support type (Just listen / Listen and give tips), switchable at any time.
- **Device accounts.** After consent, users create an account or sign in. Each account's conversations, journal, notes and mood live in its own vault, encrypted with a key derived from the account password (PBKDF2 + AES-GCM). Nothing is sent to a server, accounts don't sync between devices, and there is no password reset by design.
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
| AI | Vercel Function (`api/chat.ts`, Frankfurt) → Scaleway Generative APIs (Paris), streamed |
| Encryption | Web Crypto API (PBKDF2 + AES-GCM) |
| Tests | Vitest |

## How it works

```
Browser                                   Server (Vercel Function, Frankfurt)        AI (Scaleway, Paris)
───────                                   ───────────────────────────────────        ────────────────────
consent ─▶ device account (encrypted)
message ─▶ keyword crisis check
        ─▶ POST /api/chat  ──────────────▶ validate + rate limit
                                          system prompt (mode, support, mood, language, safety)
                                          ─────────────────────────────────────────▶ Gemma 4
streamed reply ◀───────────────────────── plain-text stream ◀─────────────────────── SSE stream
crisis lines if flagged
storage: localStorage only (encrypted account vaults, settings, consent)
```

## Project structure

```
src/App.tsx                 consent wrapper, chat flow, model status, layout
src/components/             ConsentGate, LegalDialog, ModelSetup, ChatMessage, Composer, JournalView, ...
src/lib/api.ts              client for /api/chat (streaming)
api/chat.ts                 Vercel Function entry point
server/chat.ts              validation, rate limiting, provider call, streaming
src/lib/prompt.ts           system prompt and crisis marker
src/lib/crisisDetect.ts     keyword safety net (7 languages)
src/lib/legal.ts            Impressum, privacy policy, terms (de/en)
src/lib/operator.ts         your name, address and email for the legal pages
src/lib/lock.ts             password-based encryption (conversation locks, account vaults)
src/lib/accounts.ts         device accounts: create, sign in, encrypted vaults
public/models/              model library (wasm), served from our own domain
tests/                      unit tests
```

## Deploy (Vercel + Scaleway)

1. Create a Scaleway account and an API key: console → **IAM & API keys** → **API keys** → **Generate API key**. Copy the **secret key**.
2. In Vercel → Project → **Settings → Environment Variables**, add `AI_API_KEY` with the secret key (all environments).
3. Optional: `AI_MODEL` (default `gemma-4-26b-a4b-it`) and `AI_BASE_URL` (default `https://api.scaleway.ai/v1`).
4. Fill in `src/lib/operator.ts` for the Impressum (`npm run check:legal`) and have the legal texts reviewed by a lawyer.

## Run locally

```bash
npm install
cp .env.example .env.local   # add AI_API_KEY
npm run dev                  # http://localhost:3000  (add ?mockAI to try the UI without a key)
```

On Windows PowerShell, if scripts are blocked, use `npm.cmd` instead of `npm`.

## Quality checks

```bash
npm run lint         # TypeScript, strict mode
npm test             # Vitest unit tests
npm run check:legal  # legal details filled in
npm run build
```

## The story behind it

Dilo's name comes from my cousin **Dilvin**, a psychology student who has always shown up for the people around her, especially on hard days. Her empathy and patience inspired every design decision in this app. I wanted to build something that carries even a small piece of what she naturally gives to everyone around her.

> Mental health support shouldn't feel clinical or out of reach. Dilo exists to bridge that gap.

## Roadmap

- [x] Crisis resource integration
- [x] Mood-aware replies
- [x] EU-hosted AI with streaming replies
- [ ] Conversation history across sessions and devices
- [ ] Therapist-reviewed response guidelines
- [ ] Mobile app (React Native)
