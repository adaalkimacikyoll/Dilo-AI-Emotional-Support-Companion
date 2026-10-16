import { Ear, Lightbulb } from "lucide-react";
import { cn } from "../lib/utils";
import type { SupportStyle } from "../lib/api";
import type { Strings } from "../lib/translations";

/** Lets the user choose, at any point in a conversation, whether Dilo only listens or also gives tips. */
export function SupportToggle({ t, value, onChange }: { t: Strings; value: SupportStyle; onChange: (v: SupportStyle) => void }) {
  const options: { id: SupportStyle; label: string; hint: string; Icon: typeof Ear }[] = [
    { id: "listen", label: t.listenOnly, hint: t.listenHint, Icon: Ear },
    { id: "tips", label: t.giveTips, hint: t.tipsHint, Icon: Lightbulb },
  ];
  const current = options.find((o) => o.id === value)!;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <div role="radiogroup" aria-label={t.supportLabel} className="flex rounded-full border border-line bg-surface p-0.5">
        {options.map(({ id, label, hint, Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            title={hint}
            onClick={() => onChange(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors",
              value === id ? "bg-moss text-on-accent" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted" aria-live="polite">
        {current.hint}
      </p>
    </div>
  );
}
