// Public-site chrome (Loop 10): header + footer shared by /, /pricing, /non-target, /privacy, /terms.
import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/lib/dal";

export const PUBLIC_NAV = [
  { href: "/pricing", label: "Pricing" },
  { href: "/non-target", label: "Non-Target playbook" },
];

export function SiteHeader({ session }: { session: Session | null }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="A* Apply home">
          <Image src="/logo.png" alt="A* Apply" width={96} height={96} className="h-auto w-20" priority />
        </Link>
        <nav className="flex items-center gap-4 text-sm" aria-label="Primary">
          {PUBLIC_NAV.map((n) => <Link key={n.href} href={n.href} className="text-muted hover:text-fg">{n.label}</Link>)}
          {session ? (
            <Link href="/home" className="inline-flex h-9 items-center rounded-md bg-accent px-3 font-medium text-accent-fg" data-testid="nav-app">Open the app</Link>
          ) : (
            <Link href="/login?next=/home" className="inline-flex h-9 items-center rounded-md bg-accent px-3 font-medium text-accent-fg" data-testid="nav-signin">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} A* AI. A* Apply is a study tool, not careers advice; it is not affiliated with any bank or university.</p>
        <nav className="flex gap-4" aria-label="Legal">
          <Link href="/privacy" className="hover:text-fg">Privacy</Link>
          <Link href="/terms" className="hover:text-fg">Terms</Link>
          <a href="mailto:hello@astar-apply.com" className="hover:text-fg">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
