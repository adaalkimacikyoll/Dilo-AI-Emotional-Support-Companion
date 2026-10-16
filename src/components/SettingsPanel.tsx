import type { ReactNode } from "react";
import { Footprints, Coffee, Lightbulb, SquarePen } from "lucide-react";
import { cn } from "../lib/utils";
import { LANGUAGES } from "../lib/api";
import { MoodPicker } from "./MoodPicker";
import type { LanguageCode, MoodId, Strings } from "../lib/translations";

export type Theme = "light" | "dark" | "system";
export type TextSize = "small" | "medium" | "large";

interface Props {
  t: Strings;
  language: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
  mood: MoodId | null;
  onMoodChange: (mood: MoodId | null) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  textSize: TextSize;
  onTextSizeChange: (size: TextSize) => void;
  sound: boolean;
  onSoundChange: (on: boolean) => void;
  onNewConversation: () => void;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{label}</legend>
      <div className="flex rounded-lg border border-line bg-surface p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-sm transition-colors",
              value === o.value ? "bg-moss text-on-accent" : "text-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function RecList({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink">
        <span className="text-moss" aria-hidden="true">
          {icon}
        </span>
        {title}
      </h4>
      <ul className="space-y-1 ps-6 text-sm text-muted">
        {items.map((item) => (
          <li key={item} className="list-disc marker:text-line">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SettingsPanel(p: Props) {
  const { t } = p;
  const recs = p.mood ? t.recommendations[p.mood] : null;
  const locale = p.language;

  return (
    <div className="space-y-8">
      <section aria-labelledby="mood-heading" className="space-y-3">
        <div>
          <h3 id="mood-heading" className="font-display text-lg font-bold text-ink">
            {t.moodPrompt}
          </h3>
          <p className="text-sm text-muted">{t.moodHint}</p>
        </div>
        <MoodPicker t={t} value={p.mood} onChange={p.onMoodChange} />

        {recs && p.mood && (
          <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
            <p className="font-display text-lg font-bold leading-snug text-ink">
              {t.recsTitle.replace("{mood}", t.moods[p.mood].toLocaleLowerCase(locale))}
            </p>
            <RecList icon={<Footprints className="h-4 w-4" />} title={t.activity} items={recs.activity} />
            <RecList icon={<Coffee className="h-4 w-4" />} title={t.food} items={recs.food} />
            <RecList icon={<Lightbulb className="h-4 w-4" />} title={t.extra} items={recs.extra} />
          </div>
        )}
      </section>

      <section aria-labelledby="prefs-heading" className="space-y-5 border-t border-line pt-6">
        <h3 id="prefs-heading" className="font-display text-lg font-bold text-ink">
          {t.preferences}
        </h3>

        <div>
          <label htmlFor="language-select" className="mb-2 block text-sm font-medium text-ink">
            {t.language}
          </label>
          <select
            id="language-select"
            value={p.language}
            onChange={(e) => p.onLanguageChange(e.target.value as LanguageCode)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <Segmented
          label={t.theme}
          value={p.theme}
          onChange={p.onThemeChange}
          options={[
            { value: "light", label: t.themeLight },
            { value: "dark", label: t.themeDark },
            { value: "system", label: t.themeSystem },
          ]}
        />

        <Segmented
          label={t.textSize}
          value={p.textSize}
          onChange={p.onTextSizeChange}
          options={[
            { value: "small", label: t.small },
            { value: "medium", label: t.medium },
            { value: "large", label: t.large },
          ]}
        />

        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="text-sm font-medium text-ink">{t.replySound}</span>
          <input
            type="checkbox"
            role="switch"
            checked={p.sound}
            onChange={(e) => p.onSoundChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="relative h-6 w-10 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-moss peer-focus-visible:outline-2 peer-focus-visible:outline-moss after:absolute after:start-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4"
          />
        </label>
      </section>

      <section className="border-t border-line pt-6">
        <button
          type="button"
          onClick={p.onNewConversation}
          className="flex items-center gap-2 text-sm font-medium text-ink hover:underline"
        >
          <SquarePen className="h-4 w-4" aria-hidden="true" />
          {t.newChat}
        </button>
      </section>
    </div>
  );
}
