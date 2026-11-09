import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, MailCheck } from "lucide-react";
import {
  createAccount,
  exportDataKey,
  findAccount,
  listAccounts,
  NameTakenError,
  resetPasswordWithKey,
  setEmailReset,
  signIn,
  WrongPasswordError,
  type Session,
} from "../lib/accounts";
import { AuthError, resetWithCode, saveResetKey, sendCode, verifyEmail } from "../lib/auth";
import { LANGUAGES } from "../lib/api";
import { isStrongPassword } from "../lib/lock";
import { PasswordRules } from "./PasswordRules";
import type { LegalPage } from "../lib/legal";
import type { LanguageCode, Strings } from "../lib/translations";
import { LegalLinks } from "./LegalDialog";
import { Logo } from "./Logo";

type Mode = "create" | "signin" | "reset";

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

const RESEND_AFTER_S = 60;

/** Message for an error from the email-code service. */
export function authErrorText(t: Strings, err: unknown) {
  if (!(err instanceof AuthError)) return t.genericError;
  switch (err.kind) {
    case "invalid_code":
      return t.wrongCode;
    case "rate_limited":
      return t.tooManyCodes;
    case "bad_request":
      return t.invalidEmail;
    case "network":
      return t.errors.network;
    default:
      return t.emailUnavailable;
  }
}

/** 6-digit code field with a "send a new code" button that waits a minute between sends. */
export function CodeField({ t, value, onChange, onResend }: { t: Strings; value: string; onChange: (v: string) => void; onResend: () => Promise<void> }) {
  const [wait, setWait] = useState(RESEND_AFTER_S);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  return (
    <div>
      <label htmlFor="email-code" className="mb-1.5 block text-sm font-medium">
        {t.codeLabel}
      </label>
      <input
        id="email-code"
        dir="ltr"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-center font-mono text-2xl tracking-[0.4em] text-ink focus:border-moss focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <button
          type="button"
          disabled={wait > 0}
          onClick={async () => {
            setNote(null);
            try {
              await onResend();
              setWait(RESEND_AFTER_S);
              setNote(t.codeResent);
            } catch (err) {
              setNote(authErrorText(t, err));
            }
          }}
          className="font-medium text-moss underline underline-offset-2 hover:text-ink disabled:text-muted disabled:no-underline"
        >
          {wait > 0 ? t.resendIn.replace("{s}", String(wait)) : t.resendCode}
        </button>
        {note && (
          <span role="status" className="text-muted">
            {note}
          </span>
        )}
      </div>
    </div>
  );
}

interface Props {
  t: Strings;
  language: LanguageCode;
  dir: "ltr" | "rtl";
  onLanguageChange: (code: LanguageCode) => void;
  onSession: (session: Session) => void;
  onOpenLegal: (page: LegalPage) => void;
}

/** Shown after consent: create an account (email confirmed with a code), sign in, or set a new password with an emailed code. */
export function AccountGate({ t, language, dir, onLanguageChange, onSession, onOpenLegal }: Props) {
  const [mode, setMode] = useState<Mode>(() => (listAccounts().length > 0 ? "signin" : "create"));
  const [step, setStep] = useState<"form" | "code">("form");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const email = name.trim().toLowerCase();

  const switchMode = (next: Mode) => {
    setMode(next);
    setStep("form");
    setError(null);
    setPassword("");
    setRepeat("");
    setCode("");
  };

  // New passwords are entered on the form when signing up, and on the code step when resetting.
  const askNewPassword = (mode === "create" && step === "form") || (mode === "reset" && step === "code");
  const askPassword = mode === "signin" || askNewPassword;

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (err) {
      setError(
        err instanceof NameTakenError
          ? t.nameTaken
          : err instanceof WrongPasswordError
            ? mode === "signin"
              ? t.wrongCredentials
              : t.genericError
            : authErrorText(t, err),
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(t.nameRequired);

    if (mode === "signin") return run(async () => onSession(await signIn(name, password)));

    if (!isEmail(name)) return setError(t.invalidEmail);
    if (askNewPassword) {
      if (!isStrongPassword(password)) return setError(t.passwordTooShort);
      if (password !== repeat) return setError(t.passwordMismatch);
    }

    if (mode === "create" && step === "form") {
      if (findAccount(email)) return setError(t.nameTaken);
      return run(async () => {
        await sendCode(email, "verify", language);
        setStep("code");
      });
    }

    if (mode === "create" && step === "code") {
      if (code.length !== 6) return setError(t.wrongCode);
      return run(async () => {
        const token = await verifyEmail(email, code);
        const session = await createAccount(email, password);
        try {
          await saveResetKey(email, token, await exportDataKey(session.key));
          session.account = setEmailReset(session.account.id, true) ?? session.account;
        } catch {
          // The account works without it; password reset by email can be turned on later in settings.
        }
        onSession(session);
      });
    }

    if (mode === "reset" && step === "form") {
      const account = findAccount(email);
      if (!account) return setError(t.noAccountOnDevice);
      if (!account.emailReset) return setError(t.resetNotEnabled);
      return run(async () => {
        await sendCode(email, "reset", language);
        setStep("code");
      });
    }

    if (mode === "reset" && step === "code") {
      if (code.length !== 6) return setError(t.wrongCode);
      return run(async () => onSession(await resetPasswordWithKey(email, await resetWithCode(email, code), password)));
    }
  };

  const input = "w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink focus:border-moss focus:outline-none";
  const title = step === "code" ? t.codeSentTitle : mode === "create" ? t.accountCreateTitle : mode === "reset" ? t.resetTitle : t.accountSignInTitle;
  const intro = step === "code" ? t.codeSentBody.replace("{email}", email) : mode === "reset" ? t.resetIntro : t.accountIntro;
  const submitLabel =
    step === "code" ? (mode === "reset" ? t.resetSubmit : t.confirmCode) : mode === "create" ? t.createAccount : mode === "reset" ? t.sendCode : t.signIn;

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
              {step === "code" ? <MailCheck className="h-5 w-5 text-moss" aria-hidden="true" /> : <LockKeyhole className="h-5 w-5 text-moss" aria-hidden="true" />}
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{intro}</p>
          </div>

          {step === "form" ? (
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
          ) : (
            <CodeField t={t} value={code} onChange={setCode} onResend={() => sendCode(email, mode === "reset" ? "reset" : "verify", language).then(() => undefined)} />
          )}

          {askPassword && (
            <div>
              <label htmlFor="account-password" className="mb-1.5 block text-sm font-medium">
                {mode === "reset" ? t.newPassword : t.password}
              </label>
              <input
                id="account-password"
                type="password"
                autoComplete={askNewPassword ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={askNewPassword ? "account-password-rules" : undefined}
                className={input}
              />
              {askNewPassword && <PasswordRules id="account-password-rules" t={t} password={password} />}
            </div>
          )}

          {askNewPassword && (
            <div>
              <label htmlFor="account-repeat" className="mb-1.5 block text-sm font-medium">
                {t.repeatPassword}
              </label>
              <input id="account-repeat" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={input} />
            </div>
          )}

          {mode === "create" && step === "form" ? (
            <div className="space-y-1.5 rounded-lg bg-moss-soft px-3 py-2 text-sm text-ink">
              <p>{t.accountWarning}</p>
              <p className="text-xs text-muted">{t.accountDeviceOnly}</p>
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
            {busy ? t.working : submitLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              if (step === "code") {
                setStep("form");
                setCode("");
                setError(null);
              } else switchMode(mode === "signin" ? "create" : "signin");
            }}
            className="block w-full text-center text-sm text-muted underline underline-offset-2 hover:text-ink"
          >
            {step === "code" ? t.changeEmail : mode === "create" ? t.haveAccount : mode === "reset" ? t.backToSignIn : t.newAccount}
          </button>
        </form>

        <LegalLinks t={t} onOpen={onOpenLegal} className="mt-6 border-t border-line pt-4" />
      </div>
    </div>
  );
}
