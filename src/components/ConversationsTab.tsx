import { useState } from "react";
import { Lock, LockOpen, MessageCircle, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { lockConversation, unlockConversation, type Conversation } from "../lib/journal";
import type { LanguageCode, Strings } from "../lib/translations";
import { ChatMessage } from "./ChatMessage";
import { Dialog } from "./Dialog";
import { PasswordDialog } from "./PasswordDialog";
import type { TextSize } from "./SettingsPanel";

interface Props {
  t: Strings;
  language: LanguageCode;
  dir: "ltr" | "rtl";
  textSize: TextSize;
  conversations: Conversation[];
  activeId: string | null;
  onContinue: (id: string) => void;
  onReplace: (conversation: Conversation) => void;
  onDelete: (id: string) => void;
}

type PasswordTarget = { mode: "set" | "enter"; id: string } | null;

const IconButton = ({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={cn("rounded-full p-2 transition-colors", danger ? "text-muted hover:bg-alert-soft hover:text-alert" : "text-muted hover:bg-moss-soft hover:text-ink")}
  >
    {children}
  </button>
);

export function ConversationsTab({ t, language, dir, textSize, conversations, activeId, onContinue, onReplace, onDelete }: Props) {
  const [passwordTarget, setPasswordTarget] = useState<PasswordTarget>(null);
  const [viewing, setViewing] = useState<Conversation | null>(null);

  const dateFormat = new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" });
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const remove = (id: string) => {
    if (!confirm(t.deleteConversationConfirm)) return;
    onDelete(id);
    if (viewing?.id === id) setViewing(null);
  };

  const submitPassword = async (password: string) => {
    if (!passwordTarget) return;
    const conversation = conversations.find((c) => c.id === passwordTarget.id);
    if (!conversation) return;
    if (passwordTarget.mode === "set") {
      onReplace(await lockConversation(conversation, password));
    } else {
      setViewing(await unlockConversation(conversation, password));
    }
    setPasswordTarget(null);
  };

  if (sorted.length === 0) {
    return <p className="py-10 text-center text-muted">{t.conversationsEmpty}</p>;
  }

  return (
    <>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {sorted.map((c) => {
          const locked = !!c.lock;
          return (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn("shrink-0", locked ? "text-moss" : "text-muted")} aria-hidden="true">
                {locked ? <Lock className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
              </span>
              <button
                type="button"
                onClick={() => (locked ? setPasswordTarget({ mode: "enter", id: c.id }) : onContinue(c.id))}
                className="min-w-0 flex-1 text-start"
              >
                <span className="flex items-center gap-2">
                  <span className={cn("truncate font-medium", locked && "italic text-muted")}>{locked ? t.lockedConversation : c.title}</span>
                  {c.id === activeId && (
                    <span className="shrink-0 rounded-full bg-moss-soft px-2 py-0.5 text-xs text-ink">{t.currentChat}</span>
                  )}
                </span>
                <span className="block text-xs text-muted">
                  {dateFormat.format(c.updatedAt)}
                  {!locked && <> &nbsp;&middot;&nbsp; {t.messagesCount.replace("{n}", String(c.messages.length))}</>}
                </span>
              </button>
              <div className="flex shrink-0 items-center">
                {locked ? (
                  <IconButton label={t.openLocked} onClick={() => setPasswordTarget({ mode: "enter", id: c.id })}>
                    <LockOpen className="h-4 w-4" />
                  </IconButton>
                ) : (
                  <IconButton label={t.lock} onClick={() => setPasswordTarget({ mode: "set", id: c.id })}>
                    <Lock className="h-4 w-4" />
                  </IconButton>
                )}
                <IconButton label={t.deleteConversation} onClick={() => remove(c.id)} danger>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </li>
          );
        })}
      </ul>

      <PasswordDialog
        t={t}
        dir={dir}
        open={passwordTarget !== null}
        mode={passwordTarget?.mode ?? "enter"}
        onClose={() => setPasswordTarget(null)}
        onSubmit={submitPassword}
      />

      <Dialog open={viewing !== null} onClose={() => setViewing(null)} title={viewing?.title ?? ""} closeLabel={t.close} dir={dir}>
        {viewing && (
          <div className="space-y-6">
            <p className="flex items-center gap-2 rounded-lg bg-moss-soft px-3 py-2 text-sm">
              <Lock className="h-4 w-4 shrink-0 text-moss" aria-hidden="true" />
              {t.readOnlyNote}
            </p>
            <div className="space-y-6">
              {viewing.messages.map((m) => (
                <ChatMessage key={m.id} message={m} t={t} language={language} textSize={textSize} />
              ))}
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => remove(viewing.id)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-alert hover:bg-alert-soft"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t.deleteConversation}
              </button>
              <button
                type="button"
                onClick={() => {
                  onReplace(viewing);
                  setViewing(null);
                }}
                className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-on-accent"
              >
                <LockOpen className="h-4 w-4" aria-hidden="true" />
                {t.removeLock}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
