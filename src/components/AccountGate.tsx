import { useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { createAccount, listAccounts, NameTakenError, signIn, WrongPasswordError, type Session } from "../lib/accounts";
import { LANGUAGES } from "../lib/api";
import { MIN_PASSWORD_LENGTH } from "../lib/lock";
import type { LegalPage } from "../lib/legal";
import type { LanguageCode, Strings } from "../lib/translations";
import { LegalLinks } from "./LegalDialog";
import { Logo } from "./Logo";

interface Props {
  t: Strings;
  language: LanguageCode;
  dir: "ltr" | "rtl";
  onLanguageChange: (code: LanguageCode) => void;
  onSession: (session: Session) => void;
  onOpenLegal: (page: LegalPage) => void;
}

/** Shown after consent: create a device account or sign in to one. */
export function AccountGate({ t, language, dir, onLanguageChange, onSession, onOpenLegal }: Props) {
  const [mode, setMode] = useState<"create" | "signin">(() => (listAccounts().length > 0 ? "signin" : "create"));
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: "create" | "signin") => {
    setMode(next);
    setError(null);
    setPassword("");
    setRepeat("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(t.nameRequired);
    if (mode === "create") {
      if (password.length < MIN_PASSWORD_LENGTH) return setError(t.passwordTooShort);
      if (password !== repeat) return setError(t.passwordMismatch);
    }
    setBusy(true);
    setError(null);
    try {
      onSession(mode === "create" ? await createAccount(name, password) : await signIn(name, password));
    } catch (err) {
      setError(err instanceof NameTakenError ? t.nameTaken : err instanceof WrongPasswordError ? t.wrongCredentials : t.genericError);
      setBusy(false);
    }
  };

  const input = "w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink focus:border-moss focus:outline-none";

  return (
    <div dir={dir} className="flex min-h-dvh items-center justify-center bg-paper px-4 py-8 text-ink">
      <div role="dialog" aria-modal="true" aria-labelledby="account-title" className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="font-display text-2xl font-bold">Dilo</span>
          </div>
          <label className="sr-only" htmlFor="account-language">
            {t.language}
          </label>
          <select
            id="account-language"
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

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <h1 id="account-title" className="flex items-center gap-2 font-display text-2xl font-bold">
              <LockKeyhole className="h-5 w-5 text-moss" aria-hidden="true" />
              {mode === "create" ? t.accountCreateTitle : t.accountSignInTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.accountIntro}</p>
          </div>

          <div>
            <label htmlFor="account-name" className="mb-1.5 block text-sm font-medium">
              {t.accountName}
            </label>
            <input id="account-name" autoFocus autoComplete="username" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </div>

          <div>
            <label htmlFor="account-password" className="mb-1.5 block text-sm font-medium">
              {t.password}
            </label>
            <input
              id="account-password"
              type="password"
              autoComplete={mode === "create" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
            />
          </div>

          {mode === "create" && (
            <div>
              <label htmlFor="account-repeat" className="mb-1.5 block text-sm font-medium">
                {t.repeatPassword}
              </label>
              <input id="account-repeat" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={input} />
            </div>
          )}

          {mode === "create" ? (
            <div className="space-y-1.5 rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert">
              <p>{t.accountWarning}</p>
              <p className="text-xs">{t.accountDeviceOnly}</p>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted">{t.forgotPassword}</p>
          )}

          {error && (
            <p role="alert" className="text-sm text-alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="w-full rounded-lg bg-moss px-5 py-2.5 font-semibold text-on-accent transition-opacity disabled:opacity-50">
            {busy ? t.working : mode === "create" ? t.createAccount : t.signIn}
          </button>

          <button
            type="button"
            onClick={() => switchMode(mode === "create" ? "signin" : "create")}
            className="block w-full text-center text-sm text-muted underline underline-offset-2 hover:text-ink"
          >
            {mode === "create" ? t.haveAccount : t.newAccount}
          </button>
        </form>

        <LegalLinks t={t} onOpen={onOpenLegal} className="mt-6 border-t border-line pt-4" />
      </div>
    </div>
  );
}
