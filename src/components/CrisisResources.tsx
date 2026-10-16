import { Phone, ExternalLink } from "lucide-react";
import { CRISIS_LINES, helplineUrlFor } from "../lib/crisis";
import type { LanguageCode, Strings } from "../lib/translations";

/** Emergency guidance plus verified crisis lines. Used in the dialog and inline under flagged replies. */
export function CrisisResources({ t, language, compact = false }: { t: Strings; language: LanguageCode; compact?: boolean }) {
  return (
    <div className="space-y-4 text-sm">
      {!compact && <p className="text-ink leading-relaxed">{t.crisisEmergency}</p>}
      <div>
        <h3 className="mb-2 font-semibold text-ink">{t.crisisLinesTitle}</h3>
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {CRISIS_LINES.map((line) => (
            <li key={line.country} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="font-medium text-ink">
                  <span className="me-2 inline-block w-6 text-xs font-semibold text-muted">{line.country}</span>
                  {line.name}
                </p>
                {line.note && <p className="ms-8 text-xs text-muted">{line.note}</p>}
              </div>
              <a
                href={`tel:${line.tel}`}
                dir="ltr"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-moss-soft px-3 py-1 font-semibold text-moss tabular-nums hover:bg-moss hover:text-paper"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {line.phone}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <a
        href={helplineUrlFor(language)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-medium text-moss underline underline-offset-2"
      >
        {t.crisisFind}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}
