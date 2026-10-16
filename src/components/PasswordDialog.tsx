import { useEffect, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Dialog } from "./Dialog";
import { MIN_PASSWORD_LENGTH, WrongPasswordError } from "../lib/lock";
import type { Strings } from "../lib/translations";

interface Props {
  t: Strings;
  open: boolean;
  mode: "set" | "enter";
  dir: "ltr" | "rtl";
  onClose: () => void;
  /** Throw WrongPasswordError to show the wrong-password message. */
  onSubmit: (password: string) => Promise<void>;
}

export function PasswordDialog({ t, open, mode, dir, onClose, onSubmit }: Props) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setRepeat("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === "set") {
      if (password.length < MIN_PASSWORD_LENGTH) return setError(t.passwordTooShort);
      if (password !== repeat) return setError(t.passwordMismatch);
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof WrongPasswordError ? t.wrongPassword : t.errors.unknown);
      setBusy(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-moss focus:outline-none";

  return (
    <Dialog open={open} onClose={onClose} title={mode === "set" ? t.lockTitle : t.unlockTitle} closeLabel={t.close} dir={dir}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm leading-relaxed text-ink">{mode === "set" ? t.lockBody : t.unlockBody}</p>
        {mode === "set" && <p className="rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert">{t.lockWarning}</p>}

        <div>
          <label htmlFor="lock-password" className="mb-1.5 block text-sm font-medium">
            {t.password}
          </label>
          <input
            id="lock-password"
            type="password"
            autoFocus
            autoComplete={mode === "set" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {mode === "set" && (
          <div>
            <label htmlFor="lock-password-repeat" className="mb-1.5 block text-sm font-medium">
              {t.repeatPassword}
            </label>
            <input
              id="lock-password-repeat"
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted hover:text-ink">
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={busy || !password}
            className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-50"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            {busy ? t.working : mode === "set" ? t.lock : t.openLocked}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
