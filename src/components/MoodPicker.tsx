import { cn } from "../lib/utils";
import { MOODS } from "../lib/moods";
import type { MoodId, Strings } from "../lib/translations";

interface Props {
  t: Strings;
  value: MoodId | null;
  onChange: (mood: MoodId | null) => void;
  layout?: "row" | "grid";
}

export function MoodPicker({ t, value, onChange, layout = "grid" }: Props) {
  return (
    <div role="radiogroup" aria-label={t.moodPrompt} className={cn(layout === "row" ? "flex flex-wrap gap-2" : "grid grid-cols-3 gap-2")}>
      {MOODS.map((m) => {
        const selected = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : m.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              layout === "grid" && "justify-center",
              selected
                ? "border-moss bg-moss text-paper"
                : "border-line bg-surface text-ink hover:border-moss/50 hover:bg-moss-soft",
            )}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {m.emoji}
            </span>
            {t.moods[m.id]}
          </button>
        );
      })}
    </div>
  );
}
