"use client";

// Hover dropdown under the A* apply logo — replaces the permanent left sidebar so pages get the
// full width. Hover / focus / Enter / Space / tap opens; Escape, clicking a link, or leaving the
// trigger+panel (after a short grace period) closes.
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { NavItem } from "./nav-link";

const CLOSE_DELAY_MS = 150;

export function NavMenu({ items, staffItem }: { items: NavItem[]; staffItem: NavItem | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const cancelClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);
  const openNow = useCallback(() => { cancelClose(); setOpen(true); }, [cancelClose]);
  const closeSoon = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    function onPointerDown(e: PointerEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointerDown); };
  }, [open]);

  // Section roots ("/home", "/admin") match exactly so only one item lights up.
  const isActive = (href: string) => pathname === href || (href.split("/").length > 2 && pathname.startsWith(href + "/"));
  const linkClass = (href: string) =>
    cn("block rounded-md px-3 py-2 text-sm transition", isActive(href) ? "bg-surface text-fg" : "text-muted hover:bg-surface hover:text-fg");

  return (
    <div
      ref={root}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node | null)) closeSoon(); }}
    >
      <button
        type="button"
        className="flex items-center rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Open navigation"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); }
        }}
        data-testid="nav-logo"
      >
        <Image src="/logo.png" alt="A* Apply" width={140} height={54} priority className="h-auto w-28" />
      </button>
      {open && (
        <nav
          id={panelId}
          role="menu"
          aria-label="Site navigation"
          className="absolute left-0 top-full z-40 mt-1 w-56 rounded-lg border border-border bg-bg p-2 shadow-lg"
          data-testid="nav-menu"
        >
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <Link key={item.href} href={item.href} role="menuitem" className={linkClass(item.href)} aria-current={isActive(item.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
          {staffItem && (
            <div className="mt-2 border-t border-border pt-2">
              <Link href={staffItem.href} role="menuitem" className={linkClass(staffItem.href)} onClick={() => setOpen(false)} data-testid="nav-staff-link">
                {staffItem.label}
              </Link>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
