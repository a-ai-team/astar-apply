import type { ReactNode } from "react";
import type { Session } from "@/lib/dal";
import { isStaff } from "@/lib/roles";
import { signOut } from "@/app/auth/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NavItem } from "./nav-link";
import { NavMenu } from "./nav-menu";
import { CommandPalette } from "@/components/practice/command-palette";

export const HOME_NAV: NavItem[] = [
  { href: "/home", label: "Home" },
  { href: "/home/mentor", label: "Mentor" },
  { href: "/home/technicals", label: "Technicals" },
  { href: "/home/path", label: "10-week path" },
  { href: "/home/practice", label: "Practice" },
  { href: "/home/flashcards", label: "Flashcards" },
  { href: "/home/progress", label: "Progress" },
  { href: "/home/interviews", label: "Interviews" },
  { href: "/home/pulse", label: "Pulse" },
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
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-bg text-fg" data-testid="app-shell">
      <header className="flex items-center justify-between border-b border-border px-4 py-2 md:px-6">
        <NavMenu items={nav} staffItem={staffItem} />
        <div className="ml-auto flex items-center gap-3">
          {nav === HOME_NAV && <CommandPalette />}
          <Badge tone={session.role === "student" ? "neutral" : "accent"}>{session.role}</Badge>
          <span className="hidden text-sm text-muted sm:inline" data-testid="user-email">
            {session.email}
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg"
            aria-hidden
          >
            {initial}
          </span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" data-testid="sign-out">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
