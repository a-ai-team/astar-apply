"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; disabled?: boolean };

export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const base = "flex items-center justify-between rounded-md px-3 py-2 text-sm transition";
  if (item.disabled) {
    return (
      <span className={cn(base, "cursor-not-allowed text-muted/50")} aria-disabled title="Coming soon">
        {item.label}
        <span className="text-[10px] uppercase tracking-wide">soon</span>
      </span>
    );
  }
  return (
    <Link href={item.href} className={cn(base, active ? "bg-surface text-fg" : "text-muted hover:bg-surface hover:text-fg")}>
      {item.label}
    </Link>
  );
}
