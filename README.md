# 🌻 Dilo — AI Emotional Support Companion

![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6?logo=typescript)
![React](https://img.shields.io/badge/react-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/vite-5.x-646CFF?logo=vite)
![Gemini](https://img.shields.io/badge/AI-Gemini_API-4285F4?logo=google)
![Status](https://img.shields.io/badge/status-active_development-yellow)

Dilo is an AI-powered mental wellness chat app designed to make emotional 
support feel personal, warm, and accessible. It adapts its tone and 
interaction style based on what you need — a friendly conversation or a 
more reflective, psychologist-style space.

## Features

- **Dual AI Modes** — switch between Friendly Mode and Psychologist Mode 
  at any time during a conversation
- **Mood-Based Recommendations** — select how you're feeling and receive 
  personalized activity, food, and wellness suggestions
- **Multilingual** — English, Turkish, Arabic, Persian, Spanish, French, 
  German with proper RTL rendering for Arabic and Persian
- **Voice Input** — speak directly into the chat
- **Dark / Light Mode** — comfortable for any time of day
- **Settings Panel** — font size, theme, notification sounds, and language 
  all in one place

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript |
| Build | Vite |
| AI | Google Gemini API |
| Styling | Custom CSS (no UI library) |

## Architecture
```
User Input (text / voice)
        ↓
  Mode Selector (Friendly / Psychologist)
        ↓
  Prompt Engine → Gemini API
        ↓
  Mood Parser → Recommendation Engine
        ↓
  Multilingual Response Renderer (RTL-aware)
```

## Quick Start
```bash
git clone https://github.com/adaalkimacikyoll/Dilo-AI-Emotional-Support-Companion
cd Dilo-AI-Emotional-Support-Companion
npm install
```

Create a `.env.local` file:
```
GEMINI_API_KEY=your_api_key_here
```
```bash
npm run dev
# Open http://localhost:5173
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com)

## The Story Behind It

Dilo's name comes from my cousin **Dilvin** — a psychology student who has 
always shown up for the people around her, especially on hard days. Her 
empathy and patience inspired every design decision in this app. I wanted 
to build something that carries even a small piece of what she naturally 
gives to everyone around her.

> Mental health support shouldn't feel clinical or out of reach. 
> Dilo exists to bridge that gap.

## Roadmap
- [ ] Conversation history & session memory
- [ ] Therapist-reviewed response guidelines
- [ ] Mobile app (React Native)
- [ ] Crisis resource integration
