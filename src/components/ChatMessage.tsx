import Markdown from "react-markdown";
import { LifeBuoy } from "lucide-react";
import { cn } from "../lib/utils";
import { Logo } from "./Logo";
import { CrisisResources } from "./CrisisResources";
import type { LanguageCode, Strings } from "../lib/translations";
import type { TextSize } from "./SettingsPanel";
import type { StoredMessage } from "../lib/journal";

export type Message = StoredMessage;

const SIZE: Record<TextSize, string> = {
  small: "text-[13px]",
  medium: "text-[14.5px]",
  large: "text-[17px]",
};

const USER_SIZE: Record<TextSize, string> = {
  small: "text-[13px]",
  medium: "text-[14px]",
  large: "text-[16px]",
};

export function ChatMessage({
  message,
  t,
  language,
  textSize,
}: {
  message: Message;
  t: Strings;
  language: LanguageCode;
  textSize: TextSize;
}) {
  const time = new Date(message.timestamp).toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" });

  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="sr-only">{t.you}</span>
        <div
          className={cn(
            "max-w-[80%] whitespace-pre-wrap rounded-xl rounded-se-none bg-moss px-3 py-1.5 leading-relaxed text-on-accent shadow-sm sm:max-w-[65%]",
            USER_SIZE[textSize],
          )}
        >
          {message.text}
        </div>
        <time className="px-1 text-xs text-muted">{time}</time>
        {message.crisis && <CrisisCard t={t} language={language} />}
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <Logo className="mt-0.5 h-6 w-6" />
      <div className="min-w-0 flex-1 space-y-2">
        <span className="sr-only">Dilo</span>
        <div className={cn("dilo-prose w-fit max-w-full sm:max-w-[min(78%,44rem)] rounded-xl rounded-ss-none border border-line bg-surface px-3.5 py-2 shadow-sm", SIZE[textSize])}>
          <Markdown>{message.text}</Markdown>
        </div>
        {message.crisis && <CrisisCard t={t} language={language} />}
        <time className="block text-xs text-muted">{time}</time>
      </div>
    </div>
  );
}

/** Shown under any message that signals risk, whether flagged by the keyword check or by the model. */
function CrisisCard({ t, language }: { t: Strings; language: LanguageCode }) {
  return (
    <div role="note" className="mt-1 w-full rounded-xl border border-alert/30 bg-alert-soft p-4 text-start">
      <p className="mb-3 flex items-start gap-2 text-sm font-medium text-ink">
        <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-alert" aria-hidden="true" />
        {t.crisisInline}
      </p>
      <p className="mb-4 text-sm text-ink">{t.crisisEmergency}</p>
      <CrisisResources t={t} language={language} compact />
    </div>
  );
}
