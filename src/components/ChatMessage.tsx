import Markdown from "react-markdown";
import { LifeBuoy } from "lucide-react";
import { cn } from "../lib/utils";
import { Logo } from "./Logo";
import { CrisisResources } from "./CrisisResources";
import type { LanguageCode, Strings } from "../lib/translations";
import type { TextSize } from "./SettingsPanel";

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  crisis?: boolean;
}

const SIZE: Record<TextSize, string> = {
  small: "text-[15px]",
  medium: "text-[17px]",
  large: "text-[20px]",
};

const USER_SIZE: Record<TextSize, string> = {
  small: "text-sm",
  medium: "text-[15px]",
  large: "text-lg",
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
            "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-ee-md bg-moss-soft px-4 py-2.5 text-ink sm:max-w-[75%]",
            USER_SIZE[textSize],
          )}
        >
          {message.text}
        </div>
        <time className="px-1 text-xs text-muted">{time}</time>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Logo className="mt-1 h-7 w-7" />
      <div className="min-w-0 flex-1 space-y-2">
        <span className="sr-only">Dilo</span>
        <div className={cn("dilo-prose", SIZE[textSize])}>
          <Markdown>{message.text}</Markdown>
        </div>
        {message.crisis && (
          <div className="rounded-xl border border-alert/30 bg-alert-soft p-4">
            <p className="mb-3 flex items-start gap-2 text-sm font-medium text-ink">
              <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-alert" aria-hidden="true" />
              {t.crisisInline}
            </p>
            <p className="mb-4 text-sm text-ink">{t.crisisEmergency}</p>
            <CrisisResources t={t} language={language} compact />
          </div>
        )}
        <time className="block text-xs text-muted">{time}</time>
      </div>
    </div>
  );
}
