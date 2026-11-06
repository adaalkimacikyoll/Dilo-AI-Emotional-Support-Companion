import { useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { createAccount, listAccounts, NameTakenError, resetPassword, signIn, WrongPasswordError, type Session } from "../lib/accounts";
import { LANGUAGES } from "../lib/api";
import { isStrongPassword } from "../lib/lock";
import { PasswordRules } from "./PasswordRules";
import type { LegalPage } from "../lib/legal";
import type { LanguageCode, Strings } from "../lib/translations";
import { LegalLinks } from "./LegalDialog";
import { Logo } from "./Logo";
import { RecoveryCodeView, type RecoveryReason } from "./RecoveryCodeView";

type Mode = "create" | "signin" | "reset";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

interface Props {
  t: Strings;
  language: LanguageCode;
  dir: "ltr" | "rtl";
  onLanguageChange: (code: LanguageCode) => void;
  onSession: (session: Session) => void;
  onOpenLegal: (page: LegalPage) => void;
}

/** Shown after consent: create a device account, sign in, or set a new password with the recovery code. */
export function AccountGate({ t, language, dir, onLanguageChange, onSession, onOpenLegal }: Props) {
  const [mode, setMode] = useState<Mode>(() => (listAccounts().length > 0 ? "signin" : "create"));
  const [recovery, setRecovery] = useState("");
  // A session that comes with a new recovery code is held back until the user has saved the code.
  const [pending, setPending] = useState<{ session: Session; reason: RecoveryReason } | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword("");
    setRepeat("");
    setRecovery("");
  };

  const newPassword = mode !== "signin";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(t.nameRequired);
    // New accounts use an email address. Sign-in and reset accept any existing account name,
    // so accounts created before emails were used keep working.
    if (mode === "create" && !isEmail(name)) return setError(t.invalidEmail);
    if (mode === "reset" && !recovery.trim()) return setError(t.wrongRecovery);
    if (newPassword) {
      if (!isStrongPassword(password)) return setError(t.passwordTooShort);
      if (password !== repeat) return setError(t.passwordMismatch);
    }
    setBusy(true);
    setError(null);
    try {
      const session =
        mode === "create" ? await createAccount(name.trim().toLowerCase(), password) : mode === "reset" ? await resetPassword(name, recovery, password) : await signIn(name, password);
      if (session.recoveryCode) {
        setPending({ session, reason: mode === "create" ? "created" : mode === "reset" ? "reset" : "upgraded" });
        setBusy(false);
      } else onSession(session);
    } catch (err) {
      setError(
        err instanceof NameTakenError
          ? t.nameTaken
          : err instanceof WrongPasswordError
            ? mode === "reset"
              ? t.wrongRecovery
              : t.wrongCredentials
            : t.genericError,
      );
      setBusy(false);
    }
  };

  const input = "w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink focus:border-moss focus:outline-none";

  return (
    <div dir={dir} className="flex min-h-dvh items-center justify-center bg-paper px-4 py-8 text-ink">
      <div role="dialog" aria-modal="true" aria-labelledby={pending ? "recovery-title" : "account-title"} className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl sm:p-8">
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

        {pending ? (
          <RecoveryCodeView
            t={t}
            code={pending.session.recoveryCode!}
            accountName={pending.session.account.name}
            reason={pending.reason}
            onDone={() => onSession({ ...pending.session, recoveryCode: undefined })}
          />
        ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <h1 id="account-title" className="flex items-center gap-2 font-display text-2xl font-bold">
              <LockKeyhole className="h-5 w-5 text-moss" aria-hidden="true" />
              {mode === "create" ? t.accountCreateTitle : mode === "reset" ? t.resetTitle : t.accountSignInTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{mode === "reset" ? t.resetIntro : t.accountIntro}</p>
          </div>

          <div>
            <label htmlFor="account-name" className="mb-1.5 block text-sm font-medium">
              {t.accountName}
            </label>
            <input
              id="account-name"
              type="email"
              inputMode="email"
              dir="ltr"
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              placeholder="name@example.com"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input}
            />
          </div>

          {mode === "reset" && (
            <div>
              <label htmlFor="account-recovery" className="mb-1.5 block text-sm font-medium">
                {t.recoveryCodeLabel}
              </label>
              <input
                id="account-recovery"
                dir="ltr"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={recovery}
                onChange={(e) => setRecovery(e.target.value)}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                className={`${input} font-mono tracking-wider`}
              />
            </div>
          )}

          <div>
            <label htmlFor="account-password" className="mb-1.5 block text-sm font-medium">
              {mode === "reset" ? t.newPassword : t.password}
            </label>
            <input
              id="account-password"
              type="password"
              autoComplete={newPassword ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={newPassword ? "account-password-rules" : undefined}
              className={input}
            />
            {newPassword && <PasswordRules id="account-password-rules" t={t} password={password} />}
          </div>

          {newPassword && (
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
          ) : mode === "signin" ? (
            <button type="button" onClick={() => switchMode("reset")} className="text-sm font-medium text-moss underline underline-offset-2 hover:text-ink">
              {t.forgotPasswordLink}
            </button>
          ) : null}

          {error && (
            <p role="alert" className="text-sm text-alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="w-full rounded-lg bg-moss px-5 py-2.5 font-semibold text-on-accent transition-opacity disabled:opacity-50">
            {busy ? t.working : mode === "create" ? t.createAccount : mode === "reset" ? t.resetSubmit : t.signIn}
          </button>

          <button
            type="button"
            onClick={() => switchMode(mode === "signin" ? "create" : "signin")}
            className="block w-full text-center text-sm text-muted underline underline-offset-2 hover:text-ink"
          >
            {mode === "create" ? t.haveAccount : mode === "reset" ? t.backToSignIn : t.newAccount}
          </button>
        </form>
        )}

        <LegalLinks t={t} onOpen={onOpenLegal} className="mt-6 border-t border-line pt-4" />
      </div>
    </div>
  );
}
