import { useState } from "react";
import { exportDataKey, setEmailReset, type Session } from "../lib/accounts";
import { saveResetKey, sendCode, verifyEmail } from "../lib/auth";
import type { LanguageCode, Strings } from "../lib/translations";
import { authErrorText, CodeField, isEmail } from "./AccountGate";

/** Turns on password reset by email for a signed-in account: confirm the email with a code, then save the key copy. */
export function EmailResetSetup({ t, language, session, onDone }: { t: Strings; language: LanguageCode; session: Session; onDone: () => void }) {
  const email = session.account.name.trim().toLowerCase();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isEmail(email)) return <p className="text-sm text-ink">{t.emailResetNeedsEmail}</p>;

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (err) {
      setError(authErrorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!sent) return run(async () => void (await sendCode(email, "verify", language), setSent(true)));
        if (code.length !== 6) return setError(t.wrongCode);
        run(async () => {
          const token = await verifyEmail(email, code);
          await saveResetKey(email, token, await exportDataKey(session.key));
          session.account = setEmailReset(session.account.id, true) ?? session.account;
          onDone();
        });
      }}
    >
      <p className="text-sm leading-relaxed text-muted">{sent ? t.codeSentBody.replace("{email}", email) : t.emailResetOff}</p>
      {sent && <CodeField t={t} value={code} onChange={setCode} onResend={() => sendCode(email, "verify", language).then(() => undefined)} />}
      {error && (
        <p role="alert" className="text-sm text-alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="w-full rounded-lg bg-moss px-5 py-2.5 font-semibold text-on-accent disabled:opacity-50">
        {busy ? t.working : sent ? t.confirmCode : t.sendCode}
      </button>
    </form>
  );
}
