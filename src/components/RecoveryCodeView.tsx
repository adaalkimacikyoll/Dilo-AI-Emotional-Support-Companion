import { useState } from "react";
import { Check, Copy, Download, KeyRound } from "lucide-react";
import type { Strings } from "../lib/translations";

export type RecoveryReason = "created" | "reset" | "upgraded" | "new";

interface Props {
  t: Strings;
  code: string;
  accountName: string;
  reason: RecoveryReason;
  onDone: () => void;
  /** When shown inside a dialog that already has the title. */
  hideTitle?: boolean;
}

/** Shows a recovery code once, with copy and download, and only lets the user continue after confirming they saved it. */
export function RecoveryCodeView({ t, code, accountName, reason, onDone, hideTitle = false }: Props) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const intro = {
    created: t.recoveryIntroCreated,
    reset: t.recoveryIntroReset,
    upgraded: t.recoveryIntroUpgraded,
    new: t.recoveryIntroNew,
  }[reason];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the code is still visible and can be downloaded.
    }
  };

  const download = () => {
    const text = t.recoveryFileText.replace("{name}", accountName).replace("{code}", code);
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "dilo-recovery-code.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const button = "flex items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-moss/60 hover:bg-moss-soft";

  return (
    <div className="space-y-4">
      <div>
        <h2 id="recovery-title" className={hideTitle ? "sr-only" : "flex items-center gap-2 font-display text-2xl font-bold"}>
          <KeyRound className="h-5 w-5 text-moss" aria-hidden="true" />
          {t.recoveryTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{intro}</p>
      </div>

      <p
        dir="ltr"
        aria-label={t.recoveryCodeLabel}
        className="select-all break-all rounded-xl border border-moss/40 bg-moss-soft px-4 py-3 text-center font-mono text-lg font-semibold tracking-wider text-ink"
      >
        {code}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={copy} className={button}>
          {copied ? <Check className="h-4 w-4 text-moss" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? t.codeCopied : t.copyCode}
        </button>
        <button type="button" onClick={download} className={button}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t.downloadCode}
        </button>
      </div>

      <p className="rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert">{t.recoveryWarning}</p>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-moss)]" />
        <span>{t.recoverySaved}</span>
      </label>

      <button
        type="button"
        onClick={onDone}
        disabled={!saved}
        className="w-full rounded-lg bg-moss px-5 py-2.5 font-semibold text-on-accent transition-opacity disabled:opacity-40"
      >
        {t.continueLabel}
      </button>
    </div>
  );
}
