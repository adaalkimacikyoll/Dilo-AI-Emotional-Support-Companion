/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Languages, 
  Heart, 
  Sparkles, 
  User, 
  Bot, 
  Menu, 
  X,
  History,
  Activity,
  Utensils,
  Cpu,
  ChevronDown,
  Mic,
  MicOff
} from "lucide-react";
import Markdown from "react-markdown";
import { cn } from "./lib/utils";
import { LANGUAGES, MODELS, chatWithDilo } from "./lib/gemini";
import { TRANSLATIONS } from "./lib/translations";

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
  timestamp: number;
  isError?: boolean;
}

const MOODS = [
  { id: "happy", emoji: "😊" },
  { id: "sad", emoji: "😔" },
  { id: "anxious", emoji: "😰" },
  { id: "tired", emoji: "😴" },
  { id: "stressed", emoji: "😤" },
  { id: "energetic", emoji: "🤩" },
];

export default function App() {
  const [language, setLanguage] = useState("en");
  const [modelId, setModelId] = useState("gemini-3-flash-preview");
  const [mode, setMode] = useState<"friendly" | "psychologist">("friendly");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Load initial state
  useEffect(() => {
    const savedMessages = localStorage.getItem("dilo_messages");
    const savedLang = localStorage.getItem("dilo_language");
    const savedModel = localStorage.getItem("dilo_model");
    const savedMode = localStorage.getItem("dilo_mode");
    const savedSelectedMood = localStorage.getItem("dilo_selected_mood");
    const savedTheme = localStorage.getItem("dilo_theme");
    const savedFontSize = localStorage.getItem("dilo_font_size");
    const savedNotifications = localStorage.getItem("dilo_notifications");
    
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedLang) setLanguage(savedLang);
    if (savedModel) setModelId(savedModel);
    if (savedMode) setMode(savedMode as "friendly" | "psychologist");
    if (savedSelectedMood) setSelectedMood(savedSelectedMood);
    if (savedTheme) setTheme(savedTheme as "light" | "dark");
    if (savedFontSize) setFontSize(savedFontSize as "small" | "medium" | "large");
    if (savedNotifications) setNotificationsEnabled(savedNotifications === "true");
    
    // Initial greeting if no messages
    if (!savedMessages) {
      const initialGreeting = {
        role: "model" as const,
        parts: [{ text: "Hi there, friend! I'm Dilo. I'm here to listen and support you. How are you feeling today?" }],
        timestamp: Date.now(),
      };
      setMessages([initialGreeting]);
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem("dilo_messages", JSON.stringify(messages));
    localStorage.setItem("dilo_language", language);
    localStorage.setItem("dilo_model", modelId);
    localStorage.setItem("dilo_mode", mode);
    localStorage.setItem("dilo_theme", theme);
    localStorage.setItem("dilo_font_size", fontSize);
    localStorage.setItem("dilo_notifications", notificationsEnabled.toString());
    if (selectedMood) localStorage.setItem("dilo_selected_mood", selectedMood);
  }, [messages, language, modelId, mode, selectedMood, theme, fontSize, notificationsEnabled]);

  // Apply theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Scroll behavior
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role === "user") {
      // User message: scroll to bottom to confirm sending
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (lastMessage.role === "model") {
      // AI message: scroll to the top of the message bubble
      // Small timeout to ensure DOM is updated and layout is stable
      setTimeout(() => {
        lastMessageRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }, 100);
    }
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      parts: [{ text: textToSend }],
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsBannerVisible(false);
    if (!textOverride) setInput("");
    setIsLoading(true);

    // Prepare history for Gemini
    const history = messages.concat(userMessage).map(m => ({
      role: m.role,
      parts: m.parts
    }));

    const responseText = await chatWithDilo(history, language, modelId, mode);
    const isError = responseText?.startsWith("⚠️") || responseText?.includes("trouble connecting");

    const diloMessage: Message = {
      role: "model",
      parts: [{ text: responseText || "I'm here for you." }],
      timestamp: Date.now(),
      isError
    };

    setMessages((prev) => [...prev, diloMessage]);
    setIsLoading(false);

    if (notificationsEnabled) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please check your browser settings and ensure microphone permissions are granted.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const dismissMessage = (timestamp: number) => {
    setMessages(prev => prev.filter(m => m.timestamp !== timestamp));
  };

  const isRTL = language === "ar" || language === "fa";
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className={cn(
      "flex h-screen font-serif overflow-hidden transition-colors duration-300",
      theme === "dark" ? "bg-stone-950 text-stone-100" : "bg-butter-50 text-stone-900"
    )}>
      {/* Settings & Recommendations Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              dir={isRTL ? "rtl" : "ltr"}
              className={cn(
                "fixed inset-y-0 right-0 z-50 w-full sm:w-96 border-l shadow-2xl flex flex-col transition-colors duration-300",
                theme === "dark" ? "bg-stone-900 border-stone-800" : "bg-white border-butter-200",
                isRTL && "text-right"
              )}
            >
              <div className={cn(
                "p-6 border-b flex items-center justify-between transition-colors duration-300",
                theme === "dark" ? "bg-stone-900/50 border-stone-800" : "bg-butter-50/30 border-butter-100"
              )}>
                <h2 className={cn(
                  "text-xl font-display font-bold flex items-center gap-2",
                  theme === "dark" ? "text-stone-100" : "text-stone-800"
                )}>
                  <Sparkles className="w-5 h-5 text-olive-butter" />
                  {t.settingsTitle}
                </h2>
                <button 
                  onClick={() => setIsPanelOpen(false)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    theme === "dark" ? "hover:bg-stone-800 text-stone-400" : "hover:bg-butter-100 text-stone-500"
                  )}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Mood Selector */}
                <section>
                  <h3 className={cn(
                    "text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors duration-300",
                    theme === "dark" ? "text-stone-500" : "text-stone-400"
                  )}>
                    <Heart className="w-4 h-4" /> {t.moodPrompt}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {MOODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMood(m.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                          selectedMood === m.id 
                            ? "bg-olive-butter border-olive-butter text-white shadow-md scale-105" 
                            : theme === "dark"
                              ? "bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-600 hover:bg-stone-700"
                              : "bg-white border-butter-100 text-stone-600 hover:border-butter-300 hover:bg-butter-50"
                        )}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{t.moods[m.id]}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Recommendations */}
                <AnimatePresence mode="wait">
                  {selectedMood && (
                    <motion.div
                      key={selectedMood}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <section className="space-y-3">
                        <h3 className={cn(
                          "text-sm font-bold flex items-center gap-2",
                          theme === "dark" ? "text-stone-200" : "text-stone-800"
                        )}>
                          <Activity className="w-4 h-4 text-olive-butter" /> {t.activity}
                        </h3>
                        <div className="space-y-2">
                          {t.recommendations[selectedMood].activity.map((item: string, i: number) => (
                            <div key={i} className={cn(
                              "p-3 rounded-xl text-sm border transition-colors duration-300",
                              theme === "dark" 
                                ? "bg-stone-800 text-stone-300 border-stone-700" 
                                : "bg-butter-50 text-stone-700 border-butter-100/50"
                            )}>
                              {item}
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className={cn(
                          "text-sm font-bold flex items-center gap-2",
                          theme === "dark" ? "text-stone-200" : "text-stone-800"
                        )}>
                          <Utensils className="w-4 h-4 text-olive-butter" /> {t.food}
                        </h3>
                        <div className="space-y-2">
                          {t.recommendations[selectedMood].food.map((item: string, i: number) => (
                            <div key={i} className={cn(
                              "p-3 rounded-xl text-sm border transition-colors duration-300",
                              theme === "dark" 
                                ? "bg-stone-800 text-stone-300 border-stone-700" 
                                : "bg-butter-50 text-stone-700 border-butter-100/50"
                            )}>
                              {item}
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className={cn(
                          "text-sm font-bold flex items-center gap-2",
                          theme === "dark" ? "text-stone-200" : "text-stone-800"
                        )}>
                          <Sparkles className="w-4 h-4 text-olive-butter" /> {t.extra}
                        </h3>
                        <div className="space-y-2">
                          {t.recommendations[selectedMood].extra.map((item: string, i: number) => (
                            <div key={i} className={cn(
                              "p-3 rounded-xl text-sm border transition-colors duration-300",
                              theme === "dark" 
                                ? "bg-stone-800 text-stone-300 border-stone-700" 
                                : "bg-butter-50 text-stone-700 border-butter-100/50"
                            )}>
                              {item}
                            </div>
                          ))}
                        </div>
                      </section>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Settings Section */}
                <section className={cn(
                  "pt-6 border-t space-y-6",
                  theme === "dark" ? "border-stone-800" : "border-butter-100"
                )}>
                  <h3 className={cn(
                    "text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors duration-300",
                    theme === "dark" ? "text-stone-500" : "text-stone-400"
                  )}>
                    <Cpu className="w-4 h-4" /> {t.settings}
                  </h3>

                  {/* Language Selector */}
                  <div>
                    <label className={cn(
                      "text-[10px] font-bold uppercase tracking-widest mb-2 block transition-colors duration-300",
                      theme === "dark" ? "text-stone-500" : "text-stone-400"
                    )}>{t.language}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                            language === lang.code 
                              ? "bg-olive-butter border-olive-butter text-white" 
                              : theme === "dark"
                                ? "bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700"
                                : "bg-white border-butter-100 text-stone-600 hover:bg-butter-50"
                          )}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Selector */}
                  <div>
                    <label className={cn(
                      "text-[10px] font-bold uppercase tracking-widest mb-2 block transition-colors duration-300",
                      theme === "dark" ? "text-stone-500" : "text-stone-400"
                    )}>{t.theme}</label>
                    <div className="flex gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                      <button
                        onClick={() => setTheme("light")}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                          theme === "light" 
                            ? "bg-white text-stone-800 shadow-sm" 
                            : "text-stone-500 hover:text-stone-700"
                        )}
                      >
                        {t.light}
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                          theme === "dark" 
                            ? "bg-stone-700 text-white shadow-sm" 
                            : "text-stone-400 hover:text-stone-200"
                        )}
                      >
                        {t.dark}
                      </button>
                    </div>
                  </div>

                  {/* Font Size Selector */}
                  <div>
                    <label className={cn(
                      "text-[10px] font-bold uppercase tracking-widest mb-2 block transition-colors duration-300",
                      theme === "dark" ? "text-stone-500" : "text-stone-400"
                    )}>{t.fontSize}</label>
                    <div className="flex gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                      {(["small", "medium", "large"] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                            fontSize === size 
                              ? theme === "dark" ? "bg-stone-700 text-white shadow-sm" : "bg-white text-stone-800 shadow-sm"
                              : theme === "dark" ? "text-stone-400 hover:text-stone-200" : "text-stone-500 hover:text-stone-700"
                          )}
                        >
                          {t[size]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notifications Toggle */}
                  <div className="flex items-center justify-between">
                    <label className={cn(
                      "text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                      theme === "dark" ? "text-stone-500" : "text-stone-400"
                    )}>{t.notifications}</label>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                        notificationsEnabled 
                          ? "bg-emerald-500 text-white" 
                          : theme === "dark" ? "bg-stone-800 text-stone-500" : "bg-stone-200 text-stone-500"
                      )}
                    >
                      {notificationsEnabled ? t.on : t.off}
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (confirm(t.resetConfirm)) {
                        setMessages([]);
                        localStorage.removeItem("dilo_messages");
                        window.location.reload();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all"
                  >
                    <History className="w-4 h-4" /> {t.clearHistory}
                  </button>
                </section>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className={cn(
          "h-20 flex items-center justify-between px-8 border-b sticky top-0 z-30 transition-colors duration-300",
          theme === "dark" ? "bg-stone-900 border-stone-800" : "bg-white border-butter-100"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-olive-butter flex items-center justify-center text-white font-bold text-xl shadow-sm">
              Di
            </div>
            <div>
              <h2 className={cn(
                "font-display text-lg font-bold",
                theme === "dark" ? "text-stone-100" : "text-stone-800"
              )}>Dilo</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className={cn(
                  "text-[11px] font-medium transition-colors duration-300",
                  theme === "dark" ? "text-stone-500" : "text-stone-400"
                )}>{t.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Mode Switcher */}
            <div className={cn(
              "flex items-center gap-1 p-1 rounded-full border transition-colors duration-300",
              theme === "dark" ? "bg-stone-800 border-stone-700" : "bg-butter-50 border-butter-100"
            )}>
              <button
                onClick={() => setMode("friendly")}
                className={cn(
                  "px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs transition-all font-bold whitespace-nowrap",
                  mode === "friendly" 
                    ? theme === "dark" ? "bg-stone-700 shadow-sm text-white" : "bg-white shadow-sm text-stone-800" 
                    : theme === "dark" ? "text-stone-500 hover:text-stone-400" : "text-stone-400 hover:text-stone-600"
                )}
              >
                {t.friendlyMode}
              </button>
              <button
                onClick={() => setMode("psychologist")}
                className={cn(
                  "px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs transition-all font-bold whitespace-nowrap",
                  mode === "psychologist" 
                    ? theme === "dark" ? "bg-stone-700 shadow-sm text-white" : "bg-white shadow-sm text-stone-800" 
                    : theme === "dark" ? "text-stone-500 hover:text-stone-400" : "text-stone-400 hover:text-stone-600"
                )}
              >
                {t.psychologistMode}
              </button>
            </div>

            <button 
              onClick={() => setIsPanelOpen(true)} 
              className={cn(
                "p-2 rounded-full transition-colors",
                theme === "dark" ? "hover:bg-stone-800 text-stone-300" : "hover:bg-butter-50 text-stone-600"
              )}
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </header>

        {/* Hero Banner - Permanent dismissal after first AI response */}
        {isBannerVisible && (
          <div className="px-8 pt-6">
            <div className="bg-olive-butter/90 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-display font-bold mb-0.5 flex items-center gap-2">
                  {t.heroTitle}
                </h3>
                <p className="text-white/90 text-xs max-w-xl leading-relaxed">
                  {t.heroSubtitle}
                </p>
              </div>
              <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              ref={i === messages.length - 1 ? lastMessageRef : null}
              className={cn(
                "flex gap-3 sm:gap-4 scroll-mt-24",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm text-white font-bold text-xs sm:text-base",
                msg.role === "user" ? "bg-stone-300" : "bg-olive-butter"
              )}>
                {msg.role === "user" ? "U" : "Di"}
              </div>
              <div className={cn(
                "flex flex-col gap-1",
                msg.role === "user" ? "items-end" : "items-start",
                msg.role === "user" ? "max-w-[55%]" : "max-w-[60%]"
              )}>
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl shadow-sm border transition-all duration-300 relative group/msg",
                  fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-base sm:text-lg" : "text-sm sm:text-[15px]",
                  msg.role === "user" 
                    ? "bg-olive-butter border-olive-butter text-white rounded-tr-none" 
                    : msg.isError
                      ? "bg-red-50 border-red-200 text-red-800 rounded-tl-none"
                      : theme === "dark"
                        ? "bg-stone-800 border-stone-700 text-stone-100 rounded-tl-none"
                        : "bg-white border-butter-100 text-stone-800 rounded-tl-none"
                )}>
                  {msg.isError && (
                    <button 
                      onClick={() => dismissMessage(msg.timestamp)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <div className={cn(
                    "markdown-body leading-relaxed transition-colors duration-300",
                    fontSize === "small" ? "prose-xs" : fontSize === "large" ? "prose-base" : "prose-sm",
                    msg.isError ? "text-red-900 prose-red" : theme === "dark" ? "text-stone-100" : "text-stone-800"
                  )}>
                    <Markdown>{msg.parts[0].text}</Markdown>
                  </div>
                  {msg.isError && msg.parts[0].text.includes("trouble connecting") && (
                    <button
                      onClick={() => handleSend(messages[messages.length - 2]?.parts[0].text)}
                      className="mt-2 text-xs font-bold underline hover:no-underline flex items-center gap-1"
                    >
                      <History className="w-3 h-3" /> Retry
                    </button>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-medium mt-1 px-2 transition-colors duration-300",
                  theme === "dark" ? "text-stone-500" : "text-stone-400"
                )}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4 mr-auto">
              <div className="w-10 h-10 rounded-full bg-olive-butter flex items-center justify-center text-white font-bold shadow-sm">
                Di
              </div>
              <div className={cn(
                "px-4 py-2.5 border rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 transition-colors duration-300",
                theme === "dark" ? "bg-stone-800 border-stone-700" : "bg-white border-butter-100"
              )}>
                <div className="w-2 h-2 rounded-full bg-olive-butter animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-olive-butter animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-olive-butter animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Field */}
        <div className={cn(
          "p-8 backdrop-blur-sm transition-colors duration-300",
          theme === "dark" ? "bg-stone-950/80" : "bg-butter-50/80"
        )}>
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mb-4 max-w-4xl mx-auto">
            <AnimatePresence>
              {t.quickSuggestions.map((text: string, i: number) => (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={i}
                  onClick={() => handleSend(text)}
                  className={cn(
                    "px-5 py-2 border rounded-full text-sm transition-all shadow-sm",
                    theme === "dark" 
                      ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700 hover:border-stone-600" 
                      : "bg-white border-butter-200 text-stone-600 hover:bg-butter-100 hover:border-butter-300"
                  )}
                >
                  {text}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          <div className="max-w-4xl mx-auto relative group flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={t.inputPlaceholder}
                className={cn(
                  "w-full border rounded-full px-8 py-4 pr-12 text-lg shadow-lg focus:outline-none focus:ring-4 transition-all group-hover:shadow-xl",
                  theme === "dark"
                    ? "bg-stone-900 border-stone-800 text-stone-100 focus:ring-olive-butter/20 placeholder:text-stone-600"
                    : "bg-white border-butter-200 text-stone-900 focus:ring-olive-butter/10 placeholder:text-stone-400"
                )}
              />
              {isListening && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{t.micActive}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isSpeechSupported && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleListening}
                  title={isListening ? t.micStop : t.micStart}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md",
                    isListening 
                      ? "bg-red-500 text-white animate-pulse" 
                      : theme === "dark" ? "bg-stone-800 text-stone-300 hover:bg-stone-700" : "bg-white text-stone-600 hover:bg-butter-50 border border-butter-200"
                  )}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-olive-butter text-white rounded-full flex items-center justify-center hover:bg-olive-butter/90 disabled:opacity-50 transition-all shadow-md"
              >
                <Send className={cn("w-5 h-5", isRTL && "rotate-180")} />
              </motion.button>
            </div>
          </div>
          <p className={cn(
            "text-center text-[11px] mt-6 uppercase tracking-[0.2em] font-bold transition-colors duration-300",
            theme === "dark" ? "text-stone-600" : "text-stone-400"
          )}>
            {t.footerNote}
          </p>
        </div>
      </main>
    </div>
  );
}
