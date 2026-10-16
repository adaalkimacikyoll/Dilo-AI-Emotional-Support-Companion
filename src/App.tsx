/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Brain, LifeBuoy, MessageCircle, RotateCw, SlidersHorizontal, Smile } from "lucide-react";
import { cn } from "./lib/utils";
import { ChatError, chatWithDilo, getLanguage, LANGUAGES, type ChatErrorKind, type Mode, type SupportStyle } from "./lib/api";
import { detectCrisis } from "./lib/crisisDetect";
import { CONSENT_VERSION } from "./lib/operator";
import type { LegalPage } from "./lib/legal";
import { TRANSLATIONS, type LanguageCode, type Strings } from "./lib/translations";
import { playReplyChime } from "./lib/sound";
import { newId, titleFrom, type Conversation, type StoredMessage } from "./lib/journal";
import { deleteAccount, saveVault, type Session, type Vault } from "./lib/accounts";
import { usePersistentState } from "./hooks/usePersistentState";
import { Logo } from "./components/Logo";
import { Dialog } from "./components/Dialog";
import { MoodPicker } from "./components/MoodPicker";
import { Composer } from "./components/Composer";
import { CrisisResources } from "./components/CrisisResources";
import { ChatMessage } from "./components/ChatMessage";
import { JournalView } from "./components/JournalView";
import { SettingsPanel, type TextSize, type Theme } from "./components/SettingsPanel";
import { ModesMenu } from "./components/ModesMenu";
import { AccountGate } from "./components/AccountGate";
import { ConsentGate } from "./components/ConsentGate";
import { LegalDialog, LegalLinks } from "./components/LegalDialog";

type View = "chat" | "journal";

const isLanguage = (v: unknown): v is LanguageCode => LANGUAGES.some((l) => l.code === v);
const isMode = (v: unknown): v is Mode => v === "friendly" || v === "psychologist";
const isSupport = (v: unknown): v is SupportStyle => v === "listen" || v === "tips";
const isTheme = (v: unknown): v is Theme => v === "light" || v === "dark" || v === "system";
const isTextSize = (v: unknown): v is TextSize => v === "small" || v === "medium" || v === "large";

const browserLanguage = (): LanguageCode => {
  const code = navigator.language?.slice(0, 2);
  return isLanguage(code) ? code : "en";
};

interface Consent {
  version: number;
  acceptedAt: number;
}
const isConsent = (v: unknown): v is Consent | null =>
  v === null || (!!v && typeof v === "object" && typeof (v as Consent).version === "number" && typeof (v as Consent).acceptedAt === "number");

const viewFromHash = (): View => (window.location.hash === "#journal" ? "journal" : "chat");

/** Small centred label shown in the chat where Dilo's conversation style changes. */
function ModeDivider({ t, mode }: { t: Strings; mode: Mode }) {
  const Icon = mode === "psychologist" ? Brain : Smile;
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-muted" role="separator">
      <span className="h-px flex-1 bg-line" />
      <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1">
        <Icon className="h-3.5 w-3.5 text-moss" aria-hidden="true" />
        {mode === "psychologist" ? t.psychologist : t.friendly}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * Entry point. Until the user has given every consent, only the consent screen and the legal pages exist:
 * no model is checked or downloaded and no other data is created.
 */
export default function App() {
  const [consent, setConsent] = usePersistentState<Consent | null>("dilo.consent", null, isConsent);
  const [language, setLanguage] = usePersistentState<LanguageCode>("dilo.language", browserLanguage, isLanguage);
  const [theme, setTheme] = usePersistentState<Theme>("dilo.theme", "system", isTheme);
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null);
  // The account key lives only in memory: reloading the page signs the user out.
  const [session, setSession] = useState<Session | null>(null);

  const t = TRANSLATIONS[language];
  const dir = getLanguage(language).rtl ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && media.matches));
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const hasConsent = consent !== null && consent.version === CONSENT_VERSION;

  return (
    <>
      {hasConsent && session ? (
        <DiloApp
          key={session.account.id}
          session={session}
          onSignOut={() => setSession(null)}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          onOpenLegal={setLegalPage}
        />
      ) : hasConsent ? (
        <AccountGate t={t} language={language} dir={dir} onLanguageChange={setLanguage} onSession={setSession} onOpenLegal={setLegalPage} />
      ) : (
        <ConsentGate
          t={t}
          language={language}
          dir={dir}
          onLanguageChange={setLanguage}
          onAccept={() => setConsent({ version: CONSENT_VERSION, acceptedAt: Date.now() })}
          onOpenLegal={setLegalPage}
        />
      )}
      <LegalDialog t={t} language={language} page={legalPage} onClose={() => setLegalPage(null)} />
    </>
  );
}

interface DiloAppProps {
  session: Session;
  onSignOut: () => void;
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onOpenLegal: (page: LegalPage) => void;
}

function DiloApp({ session, onSignOut, language, setLanguage, theme, setTheme, onOpenLegal }: DiloAppProps) {
  const [mode, setMode] = usePersistentState<Mode>("dilo.mode", "friendly", isMode);
  const [support, setSupport] = usePersistentState<SupportStyle>("dilo.support", "tips", isSupport);
  const [textSize, setTextSize] = usePersistentState<TextSize>("dilo.textSize", "medium", isTextSize);
  const [sound, setSound] = usePersistentState<boolean>("dilo.sound", false, (v): v is boolean => typeof v === "boolean");

  // Conversations, journal, notes and mood live in the account's encrypted vault.
  const [vault, setVault] = useState<Vault>(session.vault);
  const vaultRef = useRef(vault);
  vaultRef.current = vault;
  const { setConversations, setActiveId, setEntries, setNotes, setMood } = useMemo(() => {
    const field =
      <K extends keyof Vault>(key: K) =>
      (update: Vault[K] | ((prev: Vault[K]) => Vault[K])) =>
        setVault((v) => ({ ...v, [key]: typeof update === "function" ? (update as (p: Vault[K]) => Vault[K])(v[key]) : update }));
    return {
      setConversations: field("conversations"),
      setActiveId: field("activeId"),
      setEntries: field("entries"),
      setNotes: field("notes"),
      setMood: field("mood"),
    };
  }, []);
  const { conversations, activeId, entries, notes, mood } = vault;

  // Save shortly after each change, and right away when the page is hidden or closed.
  useEffect(() => {
    const id = setTimeout(() => void saveVault(session, vault), 250);
    return () => clearTimeout(id);
  }, [vault, session]);
  useEffect(() => {
    const flush = () => void saveVault(session, vaultRef.current);
    const onVisibility = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session]);

  const signOut = async () => {
    await saveVault(session, vaultRef.current);
    onSignOut();
  };

  const removeAccount = () => {
    if (!confirm(t.deleteAccountConfirm.replace("{name}", session.account.name))) return;
    deleteAccount(session.account.id);
    onSignOut();
  };

  const [view, setViewState] = useState<View>(viewFromHash);
  const [input, setInput] = useState("");
  const [loadingFor, setLoadingFor] = useState<string | null>(null);
  const [errorFor, setErrorFor] = useState<{ id: string; kind: ChatErrorKind } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [streaming, setStreaming] = useState<{ conversationId: string; text: string } | null>(null);


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

  const deleteAllData = async () => {
    if (!confirm(t.deleteAllConfirm)) return;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("dilo."))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    window.location.hash = "";
    window.location.reload();
  };

  // Follow the conversation: stay at the newest message (including a reply as it streams in),
  // unless the user has scrolled up to read something earlier.
  const followRef = useRef(true);
  useEffect(() => {
    // Only a scroll *up* by the user stops following; our own smooth scrolls only move down.
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const distance = document.documentElement.scrollHeight - (y + window.innerHeight);
      if (distance < 160) followRef.current = true;
      else if (y < lastY - 2) followRef.current = false;
      lastY = y;
    };
    // Detect the intent directly too, so a reply streaming in can never fight the user's scroll.
    const stop = () => (followRef.current = false);
    const onWheel = (e: WheelEvent) => e.deltaY < 0 && stop();
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? 0);
    const onTouchMove = (e: TouchEvent) => (e.touches[0]?.clientY ?? 0) > touchY + 8 && stop();
    const onKey = (e: KeyboardEvent) => ["ArrowUp", "PageUp", "Home"].includes(e.key) && !(e.target instanceof HTMLTextAreaElement) && stop();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  const scrollToLatest = useCallback((smooth: boolean) => {
    requestAnimationFrame(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: smooth ? "smooth" : "auto" }));
  }, []);
  useEffect(() => {
    if (view !== "chat") return;
    followRef.current = true;
    scrollToLatest(false);
  }, [view, activeId, scrollToLatest]);
  useEffect(() => {
    if (view === "chat" && followRef.current) scrollToLatest(true);
  }, [messages.length, isLoading, error, view, scrollToLatest]);
  useEffect(() => {
    if (streaming?.text && followRef.current) scrollToLatest(false);
  }, [streaming?.text, scrollToLatest]);

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
      setStreaming({ conversationId, text: "" });
      try {
        const reply = await chatWithDilo(
          { history: history.map((m) => ({ role: m.role, text: m.text })), language, mode, support, mood },
          (text) => setStreaming({ conversationId, text }),
        );
        // If the keyword check already showed crisis lines under the user's message, don't repeat them.
        const alreadyShown = !!history[history.length - 1]?.crisis;
        appendMessage(conversationId, { id: newId(), role: "model", text: reply.text, crisis: reply.crisis && !alreadyShown, mode, timestamp: Date.now() });
        if (sound) playReplyChime();
      } catch (e) {
        setErrorFor({ id: conversationId, kind: e instanceof ChatError ? e.kind : "generation_failed" });
      } finally {
        setLoadingFor(null);
        setStreaming(null);
      }
    },
    [language, mode, support, mood, sound, appendMessage],
  );

  const send = (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loadingFor) return;
    followRef.current = true; // sending always brings the newest messages into view
    const userMessage: StoredMessage = { id: newId(), role: "user", text, timestamp: Date.now(), ...(detectCrisis(text) ? { crisis: true } : {}) };

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
  /** Mode of the last Dilo reply before index i; a new conversation starts out as Friend. */
  const modeBefore = (i: number): Mode => {
    for (let j = i - 1; j >= 0; j--) if (messages[j].role === "model") return messages[j].mode ?? "friendly";
    return "friendly";
  };
  const navItems: { id: View; label: string; icon: typeof MessageCircle }[] = [
    { id: "chat", label: t.navChat, icon: MessageCircle },
    { id: "journal", label: t.navJournal, icon: BookOpen },
  ];

  return (
    <div dir={dir} className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <button type="button" onClick={startNewConversation} className="flex items-center gap-2.5" aria-label={t.newChat}>
              <Logo className="h-8 w-8" />
              <span className="hidden text-start sm:block">
                <span className="block font-display text-xl font-bold leading-none">Dilo</span>
                <span className="hidden whitespace-nowrap text-xs text-muted lg:block">{t.tagline}</span>
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
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-sm transition-colors sm:py-1.5",
                    view === id ? "bg-moss-soft font-semibold text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ModesMenu t={t} mode={mode} onModeChange={setMode} support={support} onSupportChange={setSupport} />
            <button
              type="button"
              onClick={() => setCrisisOpen(true)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium text-alert hover:bg-alert-soft"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t.getHelp}</span>
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

      <main className="relative flex-1" aria-live={view === "chat" ? "polite" : undefined}>
        <div className="mx-auto max-w-7xl px-4 py-8">
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
                        className="rounded-lg disabled:cursor-not-allowed disabled:opacity-50 border border-dashed border-line px-3 py-2 text-sm text-ink hover:border-moss/60 hover:bg-moss-soft"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <div className="space-y-8">
                  {messages.map((m, i) => (
                    <div key={m.id}>
                      {m.role === "model" && m.mode && m.mode !== modeBefore(i) && <ModeDivider t={t} mode={m.mode} />}
                      <ChatMessage message={m} t={t} language={language} textSize={textSize} />
                    </div>
                  ))}

                  {isLoading && streaming?.text && (
                    <>
                    {mode !== modeBefore(messages.length) && <ModeDivider t={t} mode={mode} />}
                    <ChatMessage
                      message={{ id: "streaming", role: "model", text: streaming.text, timestamp: Date.now() }}
                      t={t}
                      language={language}
                      textSize={textSize}
                    />
                    </>
                  )}

                  {isLoading && !streaming?.text && (
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
                      {error !== "not_configured" && error !== "bad_request" && (
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
          {view === "journal" && <LegalLinks t={t} onOpen={onOpenLegal} className="mt-12" />}
        </div>
      </main>

      {view === "chat" && (
        <footer className="sticky bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 pb-2 pt-2">
            <Composer t={t} value={input} onChange={setInput} onSend={() => send()} disabled={loadingFor !== null} />
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] leading-tight text-muted">
              <p className="text-center">{t.disclaimer}</p>
              <LegalLinks t={t} onOpen={onOpenLegal} className="text-[11px]" />
            </div>
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
          onDeleteAll={deleteAllData}
          accountName={session.account.name}
          onSignOut={signOut}
          onDeleteAccount={removeAccount}
          onOpenLegal={(page) => {
            setPanelOpen(false);
            onOpenLegal(page);
          }}
        />
      </Dialog>

      <Dialog open={crisisOpen} onClose={() => setCrisisOpen(false)} title={t.crisisTitle} closeLabel={t.close} dir={dir}>
        <CrisisResources t={t} language={language} />
      </Dialog>
    </div>
  );
}
