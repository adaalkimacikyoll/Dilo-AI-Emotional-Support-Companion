import { Download, MonitorX, ShieldCheck } from "lucide-react";
import { MODEL } from "../lib/api";
import type { ChatErrorKind } from "../lib/chat-types";
import type { Strings } from "../lib/translations";

export type ModelStatus =
  | { state: "checking" }
  | { state: "unsupported" }
  | { state: "not_downloaded" }
  | { state: "loading"; progress: number }
  | { state: "ready" }
  | { state: "error"; kind: ChatErrorKind };

/** Explains the on-device model and asks for an explicit click before anything is downloaded. */
export function ModelSetup({ t, status, onDownload }: { t: Strings; status: ModelStatus; onDownload: () => void }) {
  if (status.state === "ready" || status.state === "checking") return null;

  if (status.state === "unsupported") {
    return (
      <div role="status" className="flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed">
        <MonitorX className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
        <p>{t.modelUnsupported}</p>
      </div>
    );
  }

  const pct = status.state === "loading" ? Math.round(status.progress * 100) : 0;

  return (
    <section aria-labelledby="model-title" className="space-y-3 rounded-xl border border-line bg-surface p-5">
      <h2 id="model-title" className="flex items-center gap-2 font-display text-xl font-bold">
        <ShieldCheck className="h-5 w-5 text-moss" aria-hidden="true" />
        {t.modelTitle}
      </h2>
      <p className="text-sm leading-relaxed">{t.modelBody.replace("{model}", MODEL.name)}</p>
      <p className="text-sm leading-relaxed text-muted">{t.modelThirdParty}</p>

      {status.state === "loading" ? (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="text-sm font-medium">{t.modelPreparing.replace("{pct}", String(pct))}</p>
          <div className="h-2 overflow-hidden rounded-full bg-moss-soft" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-moss transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onDownload} className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-on-accent">
            <Download className="h-4 w-4" aria-hidden="true" />
            {t.modelDownload}
          </button>
          <span className="text-xs text-muted">{t.modelWifi}</span>
        </div>
      )}

      {status.state === "error" && (
        <p role="alert" className="text-sm text-alert">
          {t.errors[status.kind]}
        </p>
      )}
    </section>
  );
}
