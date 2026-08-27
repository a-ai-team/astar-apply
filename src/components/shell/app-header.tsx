"use client";

// Sticky app header: wordmark, a horizontal small-caps nav (active item = thin gold underline),
// and a quiet right cluster (search icon · initials · sign out). No border until the page has
// scrolled under it, so the editorial pages keep an open top. Height is fixed at --shell-header-h
// (globals.css) at md+; on small screens the nav drops to a second, horizontally scrollable row.
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { NavItem } from "./nav-link";

export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Section roots ("/home", "/admin") match exactly so only one item lights up.
  return href.split("/").length > 2 && pathname.startsWith(href + "/");
}

export function AppHeader({ items, staffItem, right }: { items: NavItem[]; staffItem: NavItem | null; right: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => { raf = 0; el.toggleAttribute("data-scrolled", window.scrollY > 8); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
  }, []);

  const link = (item: NavItem, extra?: string, testId?: string) => {
    const active = isNavActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        data-testid={testId}
        className={cn(
          "relative shrink-0 whitespace-nowrap py-2 text-[0.7rem] uppercase tracking-[0.14em] transition-colors",
          "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300",
          active ? "text-fg after:scale-x-100" : "text-muted hover:text-fg",
          extra,
        )}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header
      ref={ref}
      className="sticky top-0 z-30 border-b border-transparent bg-bg transition-colors duration-300 data-[scrolled]:border-border"
      data-testid="app-header"
    >
      <div className="flex h-16 items-center gap-8 px-4 md:px-6">
        <Link href="/home" className="flex shrink-0 items-center rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-accent" data-testid="nav-logo" aria-label="A* Apply home">
          <Image src="/wordmark.png" alt="A* Apply" width={140} height={54} priority className="h-auto w-28" />
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-7 overflow-x-auto md:flex" aria-label="Primary" data-testid="nav-bar">
          {items.map((i) => link(i))}
          {staffItem && link(staffItem, "ml-auto text-muted/80", "nav-staff-link")}
        </nav>
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </div>
      <nav className="flex h-10 items-center gap-6 overflow-x-auto px-4 md:hidden [scrollbar-width:none]" aria-label="Primary" data-testid="nav-bar-mobile">
        {items.map((i) => link(i))}
        {staffItem && link(staffItem, "text-muted/80", "nav-staff-link-mobile")}
      </nav>
    </header>
  );
}
