import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Lock, PanelLeft, Plus, Search, X } from "lucide-react";
import { cn } from "../lib/utils";
import type { Conversation } from "../lib/journal";
import type { Strings } from "../lib/translations";
import { Logo } from "./Logo";

interface Props {
  t: Strings;
  conversations: Conversation[];
  activeId: string | null;
  view: "chat" | "journal";
  accountName: string;
  /** Desktop: full width or a narrow icon rail. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Mobile: drawer over the page. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onOpenJournal: () => void;
  onOpenConversation: (id: string) => void;
  onOpenLockedConversation: () => void;
  onOpenSettings: () => void;
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => [...p][0]?.toUpperCase() ?? "")
    .join("") || "?";

/** Claude-style side navigation: new chat, journal, search and recent conversations, account at the bottom. */
export function Sidebar(props: Props) {
  const { mobileOpen, onCloseMobile } = props;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseMobile();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {/* Desktop */}
      <aside
        aria-label={props.t.sidebarLabel}
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-e border-line bg-sidebar transition-[width] duration-200 lg:block",
          props.collapsed ? "w-14" : "w-64",
        )}
      >
        <SidebarContent {...props} compact={props.collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label={props.t.close} onClick={onCloseMobile} className="absolute inset-0 bg-black/40" />
          <aside aria-label={props.t.sidebarLabel} className="absolute inset-y-0 start-0 w-72 max-w-[85vw] border-e border-line bg-sidebar shadow-xl">
            <SidebarContent {...props} compact={false} mobile />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({
  t,
  conversations,
  activeId,
  view,
  accountName,
  compact,
  mobile,
  onToggleCollapsed,
  onCloseMobile,
  onNewChat,
  onOpenJournal,
  onOpenConversation,
  onOpenLockedConversation,
  onOpenSettings,
}: Props & { compact: boolean; mobile?: boolean }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Closing the drawer after any navigation keeps mobile tidy.
  const go = (fn: () => void) => () => {
    fn();
    if (mobile) onCloseMobile();
  };

  const recents = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return [...conversations]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((c) => {
        if (!q) return true;
        if (c.lock) return false;
        return c.title.toLocaleLowerCase().includes(q) || c.messages.some((m) => m.text.toLocaleLowerCase().includes(q));
      });
  }, [conversations, query]);

  const item = "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors hover:bg-moss-soft";
  const label = (text: string) => (compact ? <span className="sr-only">{text}</span> : <span className="truncate">{text}</span>);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center gap-2 px-3", compact ? "justify-center" : "justify-between")}>
        {!compact && (
          <button type="button" onClick={go(onNewChat)} className="flex items-center gap-2" aria-label={t.newChat}>
            <Logo className="h-7 w-7" />
            <span className="font-display text-xl font-bold">Dilo</span>
          </button>
        )}
        {mobile ? (
          <button type="button" onClick={onCloseMobile} aria-label={t.closeSidebar} className="rounded-lg p-2 text-muted hover:bg-moss-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={compact ? t.openSidebar : t.closeSidebar}
            aria-expanded={!compact}
            title={compact ? t.openSidebar : t.closeSidebar}
            className="rounded-lg p-2 text-muted hover:bg-moss-soft hover:text-ink"
          >
            <PanelLeft className="h-5 w-5 rtl:-scale-x-100" />
          </button>
        )}
      </div>

      <div className="space-y-1 px-2">
        {compact ? (
          <button
            type="button"
            onClick={() => {
              onToggleCollapsed();
              setTimeout(() => searchRef.current?.focus(), 220);
            }}
            title={t.searchChats}
            className={cn(item, "justify-center")}
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label(t.searchChats)}
          </button>
        ) : (
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor={mobile ? "sidebar-search-mobile" : "sidebar-search"} className="sr-only">
              {t.searchChats}
            </label>
            <input
              id={mobile ? "sidebar-search-mobile" : "sidebar-search"}
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchChats}
              className="w-full rounded-lg border border-line bg-paper py-2 pe-2.5 ps-8 text-sm text-ink placeholder:text-muted focus:border-moss focus:outline-none"
            />
          </div>
        )}

        <button type="button" onClick={go(onNewChat)} title={compact ? t.newChat : undefined} className={cn(item, compact && "justify-center")}>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moss text-on-accent">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          {label(t.newChat)}
        </button>
        <button
          type="button"
          onClick={go(onOpenJournal)}
          aria-current={view === "journal" ? "page" : undefined}
          title={compact ? t.navJournal : undefined}
          className={cn(item, compact && "justify-center", view === "journal" && "bg-moss-soft font-semibold")}
        >
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
          {label(t.navJournal)}
        </button>
      </div>

      {compact ? (
        <div className="flex-1" />
      ) : (
        <nav aria-label={t.recents} className="mt-5 flex min-h-0 flex-1 flex-col">
          <h2 className="px-5 pb-1.5 text-xs font-medium text-muted">{t.recents}</h2>
          <ul className="sidebar-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
            {recents.length === 0 && <li className="px-3 py-2 text-sm text-muted">{query ? t.noChatsFound : t.noRecents}</li>}
            {recents.map((c) => {
              const current = view === "chat" && c.id === activeId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={go(() => (c.lock ? onOpenLockedConversation() : onOpenConversation(c.id)))}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-start text-sm transition-colors hover:bg-moss-soft",
                      current ? "bg-moss-soft font-medium text-ink" : "text-ink/85",
                    )}
                  >
                    {c.lock && <Lock className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />}
                    <span className="truncate">{c.lock ? t.lockedConversation : c.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <div className="shrink-0 border-t border-line p-2">
        <button type="button" onClick={go(onOpenSettings)} title={compact ? t.openPanel : undefined} className={cn(item, compact && "justify-center px-0")}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss text-xs font-semibold text-on-accent">{initials(accountName)}</span>
          {compact ? <span className="sr-only">{t.openPanel}</span> : <span className="truncate font-medium">{accountName}</span>}
        </button>
      </div>
    </div>
  );
}
