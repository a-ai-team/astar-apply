import type { ReactNode } from "react";
import type { Session } from "@/lib/dal";
import { isStaff } from "@/lib/roles";
import { signOut } from "@/app/auth/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { NavItem } from "./nav-link";
import { AppHeader } from "./app-header";
import { CommandPalette } from "@/components/practice/command-palette";

// Products only. Path lives under Technicals, Flashcards under Practice, Pulse under Interviews,
// Progress behind the initials avatar.
export const HOME_NAV: NavItem[] = [
  { href: "/home", label: "Home" },
  { href: "/home/mentor", label: "Mentor" },
  { href: "/home/technicals", label: "Technicals" },
  { href: "/home/practice", label: "Practice" },
  { href: "/home/interviews", label: "Interviews" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/corpus", label: "Corpus" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/lessons", label: "Lessons" },
  { href: "/admin/review", label: "Review" },
  { href: "/admin/generation", label: "Generation" },
  { href: "/admin/firms", label: "Firms" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/pulse", label: "Pulse" },
];

export function AppShell({ session, nav, children }: { session: Session; nav: NavItem[]; children: ReactNode }) {
  const initial = (session.email ?? "?").slice(0, 1).toUpperCase();
  const staffItem: NavItem | null = isStaff(session.role)
    ? { href: nav === ADMIN_NAV ? "/home" : "/admin", label: nav === ADMIN_NAV ? "Back to app" : "Admin" }
    : null;
  const right = (
    <>
      {nav === HOME_NAV && <CommandPalette />}
      <Link
        href="/home/progress"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-sm font-medium text-fg transition hover:border-muted"
        title={session.email ?? undefined}
        aria-label="Your progress"
        data-testid="user-avatar"
      >
        {initial}
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" data-testid="sign-out">
          Sign out
        </Button>
      </form>
    </>
  );
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-bg text-fg" data-testid="app-shell">
      {/* Sticky; h-16 at md+ so routes can size against --shell-header-h (globals.css). */}
      <AppHeader items={nav} staffItem={staffItem} right={right} />
      <main className="flex min-h-0 flex-1 flex-col gap-6 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
