import { Ear, Lightbulb } from "lucide-react";
import { cn } from "../lib/utils";
import type { SupportStyle } from "../lib/api";
import type { Strings } from "../lib/translations";

export const supportHint = (t: Strings, value: SupportStyle) => (value === "listen" ? t.listenHint : t.tipsHint);

/** Lets the user choose, at any point in a conversation, whether Dilo only listens or also gives tips. */
export function SupportToggle({ t, value, onChange }: { t: Strings; value: SupportStyle; onChange: (v: SupportStyle) => void }) {
  const options: { id: SupportStyle; label: string; hint: string; Icon: typeof Ear }[] = [
    { id: "listen", label: t.listenOnly, hint: t.listenHint, Icon: Ear },
    { id: "tips", label: t.giveTips, hint: t.tipsHint, Icon: Lightbulb },
  ];
  return (
      <div role="radiogroup" aria-label={t.supportLabel} className="flex w-full rounded-full border border-line bg-surface p-0.5 sm:w-auto">
        {options.map(({ id, label, hint, Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            title={hint}
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-center text-sm leading-tight transition-colors sm:flex-none sm:whitespace-nowrap",
              value === id ? "bg-moss text-on-accent" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
  );
}
