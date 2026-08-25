import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Session } from "@/lib/dal";
import { isStaff } from "@/lib/roles";
import { signOut } from "@/app/auth/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NavLink, type NavItem } from "./nav-link";

export const HOME_NAV: NavItem[] = [
  { href: "/home", label: "Home" },
  { href: "/home/mentor", label: "Mentor" },
  { href: "/home/technicals", label: "Technicals", disabled: true },
  { href: "/home/practice", label: "Practice", disabled: true },
  { href: "/home/interviews", label: "Interviews", disabled: true },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/corpus", label: "Corpus" },
  { href: "/admin/feedback", label: "Feedback" },
];

export function AppShell({ session, nav, children }: { session: Session; nav: NavItem[]; children: ReactNode }) {
  const initial = (session.email ?? "?").slice(0, 1).toUpperCase();
  return (
    <div className="flex min-h-screen flex-1 bg-bg text-fg" data-testid="app-shell">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border p-4 md:flex">
        <Link href="/home" className="mb-6 block">
          <Image src="/logo.png" alt="A* Apply" width={120} height={120} className="h-auto w-24" />
        </Link>
        <nav className="flex flex-col gap-1" data-testid="side-nav">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        {isStaff(session.role) && (
          <div className="mt-6 border-t border-border pt-4">
            <NavLink item={{ href: nav === ADMIN_NAV ? "/home" : "/admin", label: nav === ADMIN_NAV ? "Back to app" : "Admin" }} />
          </div>
        )}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <Link href="/home" className="md:hidden">
            <Image src="/logo.png" alt="A* Apply" width={80} height={80} className="h-auto w-16" />
          </Link>
          <div className="ml-auto flex items-center gap-3">
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
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 md:hidden">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
