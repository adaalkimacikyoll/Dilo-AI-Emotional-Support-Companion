import { useState } from "react";
import { Phone } from "lucide-react";
import { cn } from "../lib/utils";
import { LANGUAGES } from "../lib/api";
import type { LegalPage } from "../lib/legal";
import type { LanguageCode, Strings } from "../lib/translations";
import { LegalLinks } from "./LegalDialog";
import { Logo } from "./Logo";

interface Props {
  t: Strings;
  language: LanguageCode;
  dir: "ltr" | "rtl";
  onLanguageChange: (code: LanguageCode) => void;
  onAccept: () => void;
  onOpenLegal: (page: LegalPage) => void;
}

type Item = "age" | "notProfessional" | "healthData" | "terms";

/**
 * Blocking consent screen. Nothing else in the app loads until every box is ticked.
 * Boxes are never pre-ticked, and each covers one separate statement.
 */
export function ConsentGate({ t, language, dir, onLanguageChange, onAccept, onOpenLegal }: Props) {
  const [checked, setChecked] = useState<Record<Item, boolean>>({ age: false, notProfessional: false, healthData: false, terms: false });
  const [under18, setUnder18] = useState(false);
  const allChecked = Object.values(checked).every(Boolean);

  const items: { id: Item; text: string }[] = [
    { id: "age", text: t.gateAge },
    { id: "notProfessional", text: t.gateNotProfessional },
    { id: "healthData", text: t.gateHealthData },
    { id: "terms", text: t.gateTerms },
  ];

  return (
    <div dir={dir} className="flex min-h-dvh items-center justify-center bg-paper px-4 py-8 text-ink">
      <div role="dialog" aria-modal="true" aria-labelledby="gate-title" className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="font-display text-2xl font-bold">Dilo</span>
          </div>
          <label className="sr-only" htmlFor="gate-language">
            {t.language}
          </label>
          <select
            id="gate-language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
            className="rounded-lg border border-line bg-paper px-2 py-1 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {under18 ? (
          <section aria-live="polite" className="space-y-4">
            <h1 id="gate-title" className="font-display text-2xl font-bold">
              {t.under18Title}
            </h1>
            <p className="leading-relaxed">{t.under18Body}</p>
            <a href="tel:116111" dir="ltr" className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-2 font-semibold text-on-accent">
              <Phone className="h-4 w-4" aria-hidden="true" />
              116 111
            </a>
            <div>
              <button type="button" onClick={() => setUnder18(false)} className="text-sm text-muted underline underline-offset-2 hover:text-ink">
                {t.back}
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-5">
            <div>
              <h1 id="gate-title" className="font-display text-2xl font-bold">
                {t.gateTitle}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.gateIntro}</p>
            </div>

            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-xl border p-3 text-sm leading-relaxed transition-colors",
                      checked[item.id] ? "border-moss bg-moss-soft" : "border-line hover:border-moss/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked[item.id]}
                      onChange={(e) => setChecked((c) => ({ ...c, [item.id]: e.target.checked }))}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-moss)]"
                    />
                    <span>{item.text}</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => setUnder18(true)} className="text-sm text-muted underline underline-offset-2 hover:text-ink">
                {t.gateUnder18}
              </button>
              <button
                type="button"
                disabled={!allChecked}
                onClick={onAccept}
                className="rounded-lg bg-moss px-5 py-2.5 font-semibold text-on-accent transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.gateContinue}
              </button>
            </div>
          </section>
        )}

        <LegalLinks t={t} onOpen={onOpenLegal} className="mt-6 border-t border-line pt-4" />
      </div>
    </div>
  );
}
