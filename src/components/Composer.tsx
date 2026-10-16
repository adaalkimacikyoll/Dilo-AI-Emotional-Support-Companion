import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import type { Strings } from "../lib/translations";

interface Props {
  t: Strings;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function Composer({ t, value, onChange, onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow with content up to ~6 lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 168) + "px";
  }, [value]);

  const send = () => onSend();

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div>
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-sm focus-within:border-moss/60">
        <label htmlFor="composer" className="sr-only">
          {t.inputPlaceholder}
        </label>
        <textarea
          id="composer"
          ref={textareaRef}
          rows={1}
          maxLength={4000}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) send();
            }
          }}
          placeholder={t.inputPlaceholder}
          className="max-h-42 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label={t.send}
          title={t.send}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-moss text-on-accent transition-opacity disabled:opacity-35"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
