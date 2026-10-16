import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { newId, type Note } from "../lib/journal";
import type { LanguageCode, Strings } from "../lib/translations";

interface Props {
  t: Strings;
  language: LanguageCode;
  notes: Note[];
  setNotes: (update: (prev: Note[]) => Note[]) => void;
}

const fieldClass =
  "w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-[15px] leading-relaxed text-ink placeholder:text-muted focus:border-moss/60 focus:outline-none";

export function NotesTab({ t, language, notes, setNotes }: Props) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const dateFormat = new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" });
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  const add = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const now = Date.now();
    setNotes((prev) => [{ id: newId(), text, createdAt: now, updatedAt: now }, ...prev]);
    setDraft("");
  };

  const saveEdit = (id: string) => {
    const text = editText.trim();
    if (!text) return;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text, updatedAt: Date.now() } : n)));
    setEditingId(null);
  };

  const remove = (id: string) => {
    if (!confirm(t.deleteNoteConfirm)) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="space-y-2">
        <label htmlFor="new-note" className="sr-only">
          {t.notePlaceholder}
        </label>
        <textarea
          id="new-note"
          rows={3}
          maxLength={2000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(e);
          }}
          placeholder={t.notePlaceholder}
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.addNote}
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-muted">{t.notesEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((n) => (
            <li key={n.id} className="rounded-xl border border-line bg-surface p-4">
              {editingId === n.id ? (
                <div className="space-y-2">
                  <label htmlFor={`edit-${n.id}`} className="sr-only">
                    {t.editNote}
                  </label>
                  <textarea id={`edit-${n.id}`} rows={3} autoFocus maxLength={2000} value={editText} onChange={(e) => setEditText(e.target.value)} className={fieldClass} />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-ink">
                      {t.cancel}
                    </button>
                    <button type="button" onClick={() => saveEdit(n.id)} className="rounded-lg bg-moss px-3 py-1.5 text-sm font-semibold text-on-accent">
                      {t.saveNote}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap leading-relaxed">{n.text}</p>
                    <p className="mt-2 text-xs text-muted">{dateFormat.format(n.updatedAt)}</p>
                  </div>
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(n.id);
                        setEditText(n.text);
                      }}
                      aria-label={t.editNote}
                      title={t.editNote}
                      className="rounded-full p-2 text-muted hover:bg-moss-soft hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      aria-label={t.deleteNote}
                      title={t.deleteNote}
                      className="rounded-full p-2 text-muted hover:bg-alert-soft hover:text-alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
