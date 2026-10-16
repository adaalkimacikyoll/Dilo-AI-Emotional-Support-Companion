import { Check, Circle } from "lucide-react";
import { cn } from "../lib/utils";
import { passwordChecks } from "../lib/lock";
import type { Strings } from "../lib/translations";

/** Live checklist under a new-password field. */
export function PasswordRules({ id, t, password }: { id: string; t: Strings; password: string }) {
  const checks = passwordChecks(password);
  const rules = [
    { ok: checks.length, label: t.passwordRuleLength },
    { ok: checks.number, label: t.passwordRuleNumber },
    { ok: checks.special, label: t.passwordRuleSpecial },
  ];
  return (
    <ul id={id} className="mt-2 space-y-1 text-xs">
      {rules.map((r) => (
        <li key={r.label} className={cn("flex items-center gap-1.5", r.ok ? "text-moss" : "text-muted")}>
          {r.ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Circle className="h-3 w-3" aria-hidden="true" />}
          <span>{r.label}</span>
        </li>
      ))}
    </ul>
  );
}
