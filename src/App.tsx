/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, LifeBuoy, MessageCircle, RotateCw, SlidersHorizontal } from "lucide-react";
import { cn } from "./lib/utils";
import { ChatError, chatWithDilo, getLanguage, LANGUAGES, type ChatErrorKind, type Mode } from "./lib/api";
import { TRANSLATIONS, type LanguageCode, type MoodId, type Strings } from "./lib/translations";
import { isMoodId } from "./lib/moods";
import { playReplyChime } from "./lib/sound";
import {
  isConversations,
  isEntries,
  isNotes,
  migrateLegacyConversation,
  newId,
  titleFrom,
  type Conversation,
  type JournalEntry,
  type Note,
  type StoredMessage,
} from "./lib/journal";
import { usePersistentState } from "./hooks/usePersistentState";
import { Logo } from "./components/Logo";
import { Dialog } from "./components/Dialog";
import { MoodPicker } from "./components/MoodPicker";
import { Composer } from "./components/Composer";
import { CrisisResources } from "./components/CrisisResources";
import { ChatMessage } from "./components/ChatMessage";
import { JournalView } from "./components/JournalView";
import { SettingsPanel, type TextSize, type Theme } from "./components/SettingsPanel";

type View = "chat" | "journal";

const isLanguage = (v: unknown): v is LanguageCode => LANGUAGES.some((l) => l.code === v);
const isMode = (v: unknown): v is Mode => v === "friendly" || v === "reflective";
const isTheme = (v: unknown): v is Theme => v === "light" || v === "dark" || v === "system";
const isTextSize = (v: unknown): v is TextSize => v === "small" || v === "medium" || v === "large";
const isMoodOrNull = (v: unknown): v is MoodId | null => v === null || isMoodId(v);
const isIdOrNull = (v: unknown): v is string | null => v === null || typeof v === "string";

const browserLanguage = (): LanguageCode => {
  const code = navigator.language?.slice(0, 2);
  return isLanguage(code) ? code : "en";
};

const viewFromHash = (): View => (window.location.hash === "#journal" ? "journal" : "chat");

function ModeSwitch({ t, mode, onChange }: { t: Strings; mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div role="radiogroup" aria-label={t.modeLabel} className="flex rounded-full border border-line bg-surface p-0.5">
      {(["friendly", "reflective"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          title={m === "friendly" ? t.friendlyHint : t.reflectiveHint}
          onClick={() => onChange(m)}
          className={cn("rounded-full px-3 py-1 text-sm transition-colors", mode === m ? "bg-moss text-on-accent" : "text-muted hover:text-ink")}
        >
          {m === "friendly" ? t.friendly : t.reflective}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = usePersistentState<LanguageCode>("dilo.language", browserLanguage, isLanguage);
  const [mode, setMode] = usePersistentState<Mode>("dilo.mode", "friendly", isMode);
  const [mood, setMood] = usePersistentState<MoodId | null>("dilo.mood", null, isMoodOrNull);
  const [theme, setTheme] = usePersistentState<Theme>("dilo.theme", "system", isTheme);
  const [textSize, setTextSize] = usePersistentState<TextSize>("dilo.textSize", "medium", isTextSize);
  const [sound, setSound] = usePersistentState<boolean>("dilo.sound", false, (v): v is boolean => typeof v === "boolean");
  const [conversations, setConversations] = usePersistentState<Conversation[]>("dilo.conversations", migrateLegacyConversation, isConversations);
  const [activeId, setActiveId] = usePersistentState<string | null>("dilo.activeConversation", null, isIdOrNull);
  const [entries, setEntries] = usePersistentState<JournalEntry[]>("dilo.journal", [], isEntries);
  const [notes, setNotes] = usePersistentState<Note[]>("dilo.notes", [], isNotes);

  const [view, setViewState] = useState<View>(viewFromHash);
  const [input, setInput] = useState("");
  const [loadingFor, setLoadingFor] = useState<string | null>(null);
  const [errorFor, setErrorFor] = useState<{ id: string; kind: ChatErrorKind } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];
  const lang = getLanguage(language);
  const dir = lang.rtl ? "rtl" : "ltr";

  const active = conversations.find((c) => c.id === activeId && !c.lock) ?? null;
  const messages = active?.messages ?? [];
  const isLoading = loadingFor !== null && loadingFor === active?.id;
  const error = errorFor && errorFor.id === active?.id ? errorFor.kind : null;

  // Remove keys written by earlier versions (their data was migrated on first load).
  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("dilo_") || k === "dilo.messages")
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }, []);

  // Simple hash routing so the browser back button moves between chat and journal.
  useEffect(() => {
    const onHash = () => setViewState(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const setView = (next: View) => {
    if (next === view) return;
    window.location.hash = next === "journal" ? "journal" : "";
    setViewState(next);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  // Keep the newest content in view: the start of Dilo's reply, or the bottom after the user sends.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || view !== "chat") return;
    const target = last.role === "model" ? lastMessageRef.current : bottomRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: last.role === "model" ? "start" : "end" });
  }, [messages.length, view]);

  useEffect(() => {
    if (isLoading || error) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isLoading, error]);

  const appendMessage = useCallback(
    (conversationId: string, message: StoredMessage) =>
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, message], updatedAt: message.timestamp } : c)),
      ),
    [setConversations],
  );

  /** Replies always land in the conversation they belong to, even if the user switched meanwhile. */
  const requestReply = useCallback(
    async (conversationId: string, history: StoredMessage[]) => {
      setLoadingFor(conversationId);
      setErrorFor(null);
      try {
        const reply = await chatWithDilo({
          history: history.map((m) => ({ role: m.role, text: m.text })),
          language,
          mode,
          mood,
        });
        appendMessage(conversationId, { id: newId(), role: "model", text: reply.text, crisis: reply.crisis, timestamp: Date.now() });
        if (sound) playReplyChime();
      } catch (e) {
        setErrorFor({ id: conversationId, kind: e instanceof ChatError ? e.kind : "unknown" });
      } finally {
        setLoadingFor(null);
      }
    },
    [language, mode, mood, sound, appendMessage],
  );

  const send = (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loadingFor) return;
    const userMessage: StoredMessage = { id: newId(), role: "user", text, timestamp: Date.now() };

    let conversationId: string;
    if (active) {
      conversationId = active.id;
      appendMessage(conversationId, userMessage);
    } else {
      conversationId = newId();
      const conversation: Conversation = {
        id: conversationId,
        title: titleFrom(text),
        createdAt: userMessage.timestamp,
        updatedAt: userMessage.timestamp,
        messages: [userMessage],
      };
      setConversations((prev) => [conversation, ...prev]);
      setActiveId(conversationId);
    }
    if (textOverride === undefined) setInput("");
    void requestReply(conversationId, [...messages, userMessage]);
  };

  /** Previous conversations stay saved in the journal. */
  const startNewConversation = () => {
    setActiveId(null);
    setErrorFor(null);
    setInput("");
    setPanelOpen(false);
    setView("chat");
  };

  const continueConversation = (id: string) => {
    setActiveId(id);
    setErrorFor(null);
    setView("chat");
  };

  const replaceConversation = (conversation: Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === conversation.id ? conversation : c)));
    if (conversation.lock && conversation.id === activeId) setActiveId(null);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(null);
  };

  const isEmpty = messages.length === 0;
  const navItems: { id: View; label: string; icon: typeof MessageCircle }[] = [
    { id: "chat", label: t.navChat, icon: MessageCircle },
    { id: "journal", label: t.navJournal, icon: BookOpen },
  ];

  return (
    <div dir={dir} className="flex h-dvh flex-col bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <button type="button" onClick={startNewConversation} className="flex items-center gap-2.5" aria-label={t.newChat}>
              <Logo className="h-8 w-8" />
              <span className="hidden text-start min-[420px]:block">
                <span className="block font-display text-xl font-bold leading-none">Dilo</span>
                <span className="hidden text-xs text-muted md:block">{t.tagline}</span>
              </span>
            </button>

            <nav aria-label="Dilo" className="flex items-center gap-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  aria-current={view === id ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-colors",
                    view === id ? "bg-moss-soft font-semibold text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {view === "chat" && (
              <div className="hidden md:block">
                <ModeSwitch t={t} mode={mode} onChange={setMode} />
              </div>
            )}

            <button
              type="button"
              onClick={() => setCrisisOpen(true)}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-alert hover:bg-alert-soft"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">{t.getHelp}</span>
              <span className="sr-only lg:hidden">{t.getHelp}</span>
            </button>

            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              aria-label={t.openPanel}
              title={t.openPanel}
              className="rounded-full p-2 text-muted hover:bg-moss-soft hover:text-ink"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto" aria-live={view === "chat" ? "polite" : undefined}>
        <div className="mx-auto max-w-3xl px-4 py-8">
          {view === "journal" ? (
            <JournalView
              t={t}
              language={language}
              dir={dir}
              textSize={textSize}
              conversations={conversations}
              activeId={active?.id ?? null}
              onContinue={continueConversation}
              onReplaceConversation={replaceConversation}
              onDeleteConversation={deleteConversation}
              entries={entries}
              setEntries={setEntries}
              notes={notes}
              setNotes={setNotes}
            />
          ) : (
            <>
              <div className="mb-6 flex justify-center md:hidden">
                <ModeSwitch t={t} mode={mode} onChange={setMode} />
              </div>

              {isEmpty ? (
                <section className="pt-2 sm:pt-12">
                  <h1 className="max-w-xl font-display text-4xl font-bold leading-[1.1] sm:text-5xl">{t.welcomeTitle}</h1>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">{t.welcomeBody}</p>

                  <div className="mt-10">
                    <p className="mb-3 text-sm font-medium">{t.moodPrompt}</p>
                    <MoodPicker t={t} value={mood} onChange={setMood} layout="row" />
                  </div>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {t.quickSuggestions.map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => send(text)}
                        className="rounded-lg border border-dashed border-line px-3 py-2 text-sm text-ink hover:border-moss/60 hover:bg-moss-soft"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <div className="space-y-8">
                  {messages.map((m, i) => (
                    <div key={m.id} ref={i === messages.length - 1 ? lastMessageRef : undefined} className="scroll-mt-20">
                      <ChatMessage message={m} t={t} language={language} textSize={textSize} />
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-3" role="status">
                      <Logo className="h-7 w-7" />
                      <span className="sr-only">{t.typing}</span>
                      <span className="flex gap-1" aria-hidden="true">
                        {[0, 1, 2].map((d) => (
                          <span key={d} className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" style={{ animationDelay: `${d * 0.15}s` }} />
                        ))}
                      </span>
                    </div>
                  )}

                  {error && active && (
                    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-alert/30 bg-alert-soft px-4 py-3 text-sm">
                      <span>{t.errors[error]}</span>
                      {error !== "missing_key" && error !== "bad_request" && (
                        <button
                          type="button"
                          onClick={() => requestReply(active.id, messages)}
                          className="flex items-center gap-1.5 font-medium text-alert hover:underline"
                        >
                          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                          {t.retry}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {view === "chat" && (
        <footer className="border-t border-line bg-paper">
          <div className="mx-auto max-w-3xl px-4 pb-4 pt-3">
            <Composer t={t} value={input} onChange={setInput} onSend={() => send()} disabled={loadingFor !== null} speechLocale={lang.speechLocale} />
            <p className="mt-2 text-center text-xs text-muted">{t.disclaimer}</p>
          </div>
        </footer>
      )}

      <Dialog open={panelOpen} onClose={() => setPanelOpen(false)} title={t.openPanel} closeLabel={t.close} variant="side" dir={dir}>
        <SettingsPanel
          t={t}
          language={language}
          onLanguageChange={setLanguage}
          mood={mood}
          onMoodChange={setMood}
          theme={theme}
          onThemeChange={setTheme}
          textSize={textSize}
          onTextSizeChange={setTextSize}
          sound={sound}
          onSoundChange={setSound}
          onNewConversation={startNewConversation}
        />
      </Dialog>

      <Dialog open={crisisOpen} onClose={() => setCrisisOpen(false)} title={t.crisisTitle} closeLabel={t.close} dir={dir}>
        <CrisisResources t={t} language={language} />
      </Dialog>
    </div>
  );
}
