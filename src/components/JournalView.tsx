import { useState } from "react";
import { cn } from "../lib/utils";
import type { Conversation, JournalEntry, Note } from "../lib/journal";
import type { LanguageCode, Strings } from "../lib/translations";
import { ConversationsTab } from "./ConversationsTab";
import { EntriesTab } from "./EntriesTab";
import { NotesTab } from "./NotesTab";
import type { TextSize } from "./SettingsPanel";

type Tab = "conversations" | "entries" | "notes";

interface Props {
  t: Strings;
  language: LanguageCode;
  dir: "ltr" | "rtl";
  textSize: TextSize;
  conversations: Conversation[];
  activeId: string | null;
  onContinue: (id: string) => void;
  onReplaceConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  entries: JournalEntry[];
  setEntries: (update: (prev: JournalEntry[]) => JournalEntry[]) => void;
  notes: Note[];
  setNotes: (update: (prev: Note[]) => Note[]) => void;
}

export function JournalView(p: Props) {
  const { t } = p;
  const [tab, setTab] = useState<Tab>("conversations");
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "conversations", label: t.tabConversations, count: p.conversations.length },
    { id: "entries", label: t.tabEntries, count: p.entries.length },
    { id: "notes", label: t.tabNotes, count: p.notes.length },
  ];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold leading-tight">{t.navJournal}</h1>
        <p className="mt-2 max-w-xl leading-relaxed text-muted">{t.journalIntro}</p>
      </header>

      <div role="tablist" aria-label={t.navJournal} className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((x) => (
          <button
            key={x.id}
            role="tab"
            id={`tab-${x.id}`}
            aria-selected={tab === x.id}
            aria-controls={`panel-${x.id}`}
            onClick={() => setTab(x.id)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors",
              tab === x.id ? "border-moss font-semibold text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {x.label}
            {x.count > 0 && <span className="rounded-full bg-moss-soft px-1.5 text-xs tabular-nums text-ink">{x.count}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "conversations" && (
          <ConversationsTab
            t={t}
            language={p.language}
            dir={p.dir}
            textSize={p.textSize}
            conversations={p.conversations}
            activeId={p.activeId}
            onContinue={p.onContinue}
            onReplace={p.onReplaceConversation}
            onDelete={p.onDeleteConversation}
          />
        )}
        {tab === "entries" && <EntriesTab t={t} language={p.language} entries={p.entries} setEntries={p.setEntries} />}
        {tab === "notes" && <NotesTab t={t} language={p.language} notes={p.notes} setNotes={p.setNotes} />}
      </div>

      <p className="text-xs text-muted">{t.storageNote}</p>
    </section>
  );
}
