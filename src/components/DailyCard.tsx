import { useMemo } from "react";
import { Quote, Sun } from "lucide-react";
import { dailyPicks } from "../lib/daily";
import type { LanguageCode, Strings } from "../lib/translations";

/** Each language's own quotation marks. */
const QUOTE_MARKS: Record<LanguageCode, [string, string]> = {
  en: ["“", "”"],
  tr: ["“", "”"],
  de: ["„", "“"],
  fr: ["« ", " »"],
  es: ["«", "»"],
  el: ["«", "»"],
  ar: ["«", "»"],
  fa: ["«", "»"],
};

/** Today's quote and affirmation on the welcome screen. Changes at the user's local midnight. */
export function DailyCard({ t, language }: { t: Strings; language: LanguageCode }) {
  const { quote, affirmation } = useMemo(() => dailyPicks(), []);
  const [open, close] = QUOTE_MARKS[language];
  const comma = language === "ar" || language === "fa" ? "، " : ", ";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <figure className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-moss">
          <Quote className="h-3.5 w-3.5" aria-hidden="true" />
          {t.dailyQuote}
        </p>
        <blockquote className="font-display text-lg leading-snug text-ink">{open}
          {quote.text[language]}
          {close}</blockquote>
        <figcaption className="mt-3 text-sm text-muted">
          — {quote.author[language]}
          {comma}
          <cite className="not-italic">{quote.source[language]}</cite>
        </figcaption>
      </figure>
      <div className="rounded-2xl border border-line bg-moss-soft p-5">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-moss">
          <Sun className="h-3.5 w-3.5" aria-hidden="true" />
          {t.dailyAffirmation}
        </p>
        <p className="font-display text-lg leading-snug text-ink">{affirmation[language]}</p>
      </div>
    </div>
  );
}
