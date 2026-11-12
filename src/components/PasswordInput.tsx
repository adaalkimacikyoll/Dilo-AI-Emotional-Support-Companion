import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Strings } from "../lib/translations";

/** Password field with the classic eye button to show or hide what was typed. */
export function PasswordInput({
  t,
  className = "",
  ...props
}: { t: Strings } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        spellCheck={false}
        className={`${className} pe-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t.hidePassword : t.showPassword}
        aria-pressed={visible}
        title={visible ? t.hidePassword : t.showPassword}
        className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-lg text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-moss"
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
