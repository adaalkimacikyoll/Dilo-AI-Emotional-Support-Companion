import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Ear, HeartHandshake, Lightbulb, Smile, Brain } from "lucide-react";
import { cn } from "../lib/utils";
import type { Mode, SupportStyle } from "../lib/api";
import type { Strings } from "../lib/translations";

interface Props {
  t: Strings;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  support: SupportStyle;
  onSupportChange: (support: SupportStyle) => void;
}

/** "Modes" dropdown in the navbar: conversation style and support type. */
export function ModesMenu({ t, mode, onModeChange, support, onSupportChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const groups: {
    label: string;
    items: { id: string; label: string; hint: string; Icon: typeof Ear; selected: boolean; onSelect: () => void }[];
  }[] = [
    {
      label: t.conversationStyle,
      items: [
        { id: "friendly", label: t.friendly, hint: t.friendlyHint, Icon: Smile, selected: mode === "friendly", onSelect: () => onModeChange("friendly") },
        { id: "psychologist", label: t.psychologist, hint: t.psychologistHint, Icon: Brain, selected: mode === "psychologist", onSelect: () => onModeChange("psychologist") },
      ],
    },
    {
      label: t.supportLabel,
      items: [
        { id: "listen", label: t.listenOnly, hint: t.listenHint, Icon: Ear, selected: support === "listen", onSelect: () => onSupportChange("listen") },
        { id: "tips", label: t.giveTips, hint: t.tipsHint, Icon: Lightbulb, selected: support === "tips", onSelect: () => onSupportChange("tips") },
      ],
    },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm transition-colors",
          open ? "bg-moss-soft font-semibold text-ink" : "text-muted hover:text-ink",
        )}
      >
        <HeartHandshake className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{t.modes}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t.modes}
          className="absolute end-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-2 shadow-xl max-sm:fixed max-sm:inset-x-4 max-sm:top-16 max-sm:w-auto"
        >
          {groups.map((group, gi) => (
            <div key={group.label} role="group" aria-label={group.label} className={cn(gi > 0 && "mt-1 border-t border-line pt-1")}>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted">{group.label}</p>
              {group.items.map(({ id, label, hint, Icon, selected, onSelect }) => (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={onSelect}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-start transition-colors",
                    selected ? "bg-moss-soft" : "hover:bg-paper",
                  )}
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", selected ? "text-moss" : "text-muted")} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{label}</span>
                    <span className="block text-xs leading-snug text-muted">{hint}</span>
                  </span>
                  <Check className={cn("mt-0.5 h-4 w-4 shrink-0 text-moss", !selected && "invisible")} aria-hidden="true" />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
