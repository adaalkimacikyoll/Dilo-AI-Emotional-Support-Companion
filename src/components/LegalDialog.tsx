import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { cn } from "../lib/utils";
import { LEGAL, type LegalLanguage, type LegalPage } from "../lib/legal";
import type { LanguageCode, Strings } from "../lib/translations";
import { Dialog } from "./Dialog";

interface Props {
  t: Strings;
  language: LanguageCode;
  page: LegalPage | null;
  onClose: () => void;
}

/** Impressum, privacy policy and terms. Available in German (binding) and English. */
export function LegalDialog({ t, language, page, onClose }: Props) {
  const [legalLang, setLegalLang] = useState<LegalLanguage>(language === "de" ? "de" : "en");
  useEffect(() => setLegalLang(language === "de" ? "de" : "en"), [language]);
  const title = page === "imprint" ? t.imprint : page === "privacy" ? t.privacyPolicy : t.termsOfUse;

  return (
    <Dialog open={page !== null} onClose={onClose} title={title} closeLabel={t.close} dir="ltr">
      {page && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">{t.legalLanguageNote}</p>
            <div className="flex rounded-full border border-line bg-surface p-0.5 text-sm" role="group" aria-label="Language">
              {(["de", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={legalLang === l}
                  onClick={() => setLegalLang(l)}
                  className={cn("rounded-full px-3 py-0.5", legalLang === l ? "bg-moss text-on-accent" : "text-muted hover:text-ink")}
                >
                  {l === "de" ? "Deutsch" : "English"}
                </button>
              ))}
            </div>
          </div>
          <article lang={legalLang} className="legal-prose">
            <Markdown>{LEGAL[legalLang][page]}</Markdown>
          </article>
        </div>
      )}
    </Dialog>
  );
}

/** Small row of legal links, shown on the consent screen and at the bottom of every page. */
export function LegalLinks({ t, onOpen, className }: { t: Strings; onOpen: (page: LegalPage) => void; className?: string }) {
  const links: { page: LegalPage; label: string }[] = [
    { page: "imprint", label: t.imprint },
    { page: "privacy", label: t.privacyPolicy },
    { page: "terms", label: t.termsOfUse },
  ];
  return (
    <nav aria-label={t.imprint} className={cn("flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted", className)}>
      {links.map((l) => (
        <button key={l.page} type="button" onClick={() => onOpen(l.page)} className="underline underline-offset-2 hover:text-ink">
          {l.label}
        </button>
      ))}
    </nav>
  );
}
