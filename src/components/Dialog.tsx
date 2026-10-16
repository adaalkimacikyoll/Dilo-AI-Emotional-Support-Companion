import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  closeLabel: string;
  variant?: "center" | "side";
  dir?: "ltr" | "rtl";
  children: ReactNode;
}

/** Native <dialog> wrapper: gives focus trapping, Escape to close and a backdrop for free. */
export function Dialog({ open, onClose, title, closeLabel, variant = "center", dir = "ltr", children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      dir={dir}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "bg-paper text-ink backdrop:bg-black/40 backdrop:backdrop-blur-[2px]",
        variant === "center" && "m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-line p-0 shadow-xl",
        variant === "side" &&
          "m-0 ms-auto h-dvh max-h-dvh w-full max-w-sm border-s border-line p-0 shadow-xl",
      )}
    >
      <div className="flex h-full max-h-[inherit] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-full p-1.5 text-muted hover:bg-moss-soft hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </dialog>
  );
}
