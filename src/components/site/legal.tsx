// Legal page shell (Loop 10). Both /privacy and /terms are TEMPLATES flagged as drafts until a
// human signs them off. TODO(james): review with a solicitor / replace with the final text and
// remove `draft`.
import type { ReactNode } from "react";
import type { Session } from "@/lib/dal";
import { SiteFooter, SiteHeader } from "./chrome";

export function LegalPage({ title, updated, draft, session, children }: { title: string; updated: string; draft: boolean; session: Session | null; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        {draft && (
          <p className="mb-6 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger" data-testid="legal-draft">
            Draft template — not yet reviewed. This text is a placeholder until it has been signed off.
          </p>
        )}
        <h1 className="text-3xl font-semibold" data-testid="legal-heading">{title}</h1>
        <p className="mt-1 text-xs text-muted">Last updated {updated}</p>
        <div className="prose-lesson mt-8 text-sm [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted [&_li]:text-muted">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
