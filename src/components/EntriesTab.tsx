import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, PenLine, Plus, Trash2 } from "lucide-react";
import { newId, type JournalEntry } from "../lib/journal";
import { MOODS } from "../lib/moods";
import type { LanguageCode, MoodId, Strings } from "../lib/translations";
import { MoodPicker } from "./MoodPicker";

interface Props {
  t: Strings;
  language: LanguageCode;
  entries: JournalEntry[];
  setEntries: (update: (prev: JournalEntry[]) => JournalEntry[]) => void;
}

export function EntriesTab({ t, language, entries, setEntries }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = entries.find((e) => e.id === openId) ?? null;
  const dateFormat = new Intl.DateTimeFormat(language, { dateStyle: "full" });
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);

  const create = () => {
    const now = Date.now();
    const entry: JournalEntry = { id: newId(), title: "", body: "", mood: null, createdAt: now, updatedAt: now };
    setEntries((prev) => [entry, ...prev]);
    setOpenId(entry.id);
  };

  const update = (id: string, patch: Partial<Pick<JournalEntry, "title" | "body" | "mood">>) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e)));

  const close = () => {
    // Don't keep entries that were opened and left blank.
    if (open && !open.title.trim() && !open.body.trim()) setEntries((prev) => prev.filter((e) => e.id !== open.id));
    setOpenId(null);
  };

  const remove = (id: string) => {
    if (!confirm(t.deleteEntryConfirm)) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setOpenId(null);
  };

  if (open) {
    return <EntryEditor t={t} entry={open} date={dateFormat.format(open.createdAt)} onChange={(patch) => update(open.id, patch)} onBack={close} onDelete={() => remove(open.id)} />;
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={create} className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-on-accent">
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t.newEntry}
      </button>

      {sorted.length === 0 ? (
        <p className="py-10 text-center text-muted">{t.entriesEmpty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((e) => {
            const mood = MOODS.find((m) => m.id === e.mood);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(e.id)}
                  className="flex h-full w-full flex-col gap-1.5 rounded-xl border border-line bg-surface p-4 text-start hover:border-moss/60"
                >
                  <span className="flex items-center justify-between gap-2 text-xs text-muted">
                    {dateFormat.format(e.createdAt)}
                    {mood && (
                      <span title={t.moods[mood.id]} aria-label={t.moods[mood.id]}>
                        {mood.emoji}
                      </span>
                    )}
                  </span>
                  <span className="font-display text-lg font-bold leading-snug">{e.title.trim() || t.untitledEntry}</span>
                  <span className="line-clamp-3 text-sm text-muted">{e.body}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EntryEditor({
  t,
  entry,
  date,
  onChange,
  onBack,
  onDelete,
}: {
  t: Strings;
  entry: JournalEntry;
  date: string;
  onChange: (patch: { title?: string; body?: string; mood?: MoodId | null }) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 280) + "px";
  }, [entry.body]);

  // Changes are saved immediately; briefly confirm it.
  useEffect(() => {
    if (entry.createdAt === entry.updatedAt) return;
    setShowSaved(true);
    const id = setTimeout(() => setShowSaved(false), 1200);
    return () => clearTimeout(id);
  }, [entry.updatedAt, entry.createdAt]);

  return (
    <article className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {t.backToEntries}
        </button>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="flex items-center gap-1 text-xs text-muted">
            {showSaved && (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {t.saved}
              </>
            )}
          </span>
          <button type="button" onClick={onDelete} aria-label={t.deleteEntry} title={t.deleteEntry} className="rounded-full p-2 text-muted hover:bg-alert-soft hover:text-alert">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted">
        <PenLine className="h-4 w-4" aria-hidden="true" />
        {date}
      </p>

      <label htmlFor="entry-title" className="sr-only">
        {t.entryTitlePlaceholder}
      </label>
      <input
        id="entry-title"
        value={entry.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder={t.entryTitlePlaceholder}
        maxLength={120}
        className="w-full bg-transparent font-display text-3xl font-bold placeholder:text-muted/60 focus:outline-none"
      />

      <div>
        <p className="mb-2 text-sm font-medium">{t.entryMood}</p>
        <MoodPicker t={t} value={entry.mood} onChange={(mood) => onChange({ mood })} layout="row" />
      </div>

      <label htmlFor="entry-body" className="sr-only">
        {t.entryBodyPlaceholder}
      </label>
      <textarea
        id="entry-body"
        ref={bodyRef}
        autoFocus={!entry.body}
        value={entry.body}
        onChange={(e) => onChange({ body: e.target.value })}
        placeholder={t.entryBodyPlaceholder}
        className="dilo-prose min-h-70 w-full resize-none rounded-xl border border-line bg-surface p-5 text-[17px] placeholder:text-muted focus:border-moss/60 focus:outline-none"
      />
    </article>
  );
}
