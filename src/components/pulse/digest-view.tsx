// Renders one Pulse digest (Loop 08): intro, then each story as a card — the 30-second take,
// three talking points, historical anchors, practice questions (collapsed) and sources. Server
// component; the same view serves /home/pulse, /home/pulse/[week] and the admin preview.
import type { DigestBody } from "@/lib/pulse/schema";
import { Markdown } from "@/components/lesson/markdown";
import { Card } from "@/components/ui/card";

export function DigestView({ body, synthetic }: { body: DigestBody; synthetic?: boolean }) {
  return (
    <div className="flex flex-col gap-5" data-testid="digest">
      {synthetic && <p className="rounded-md border border-border bg-surface p-3 text-xs text-muted" data-testid="digest-synthetic">Sample digest: every company, number and source here is invented to show the format. Real weeks appear once a mentor approves them.</p>}
      {body.intro_md && <Markdown md={body.intro_md} className="text-sm" />}
      <ol className="flex flex-col gap-5">
        {body.stories.map((s, i) => (
          <li key={i}>
            <Card data-testid="pulse-story">
              <h2 className="text-lg font-semibold" data-testid="story-headline">{s.headline}</h2>
              <section className="mt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">The 30-second take</h3>
                <Markdown md={s.take_md} className="mt-1 text-sm" />
              </section>
              <section className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">What you could say in an interview</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm" data-testid="story-talking-points">{s.talking_points.map((t, j) => <li key={j}>{t}</li>)}</ul>
              </section>
              {s.anchors.length > 0 && (
                <section className="mt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Anchors</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">{s.anchors.map((a, j) => <li key={j}>{a}</li>)}</ul>
                </section>
              )}
              <details className="group mt-4" data-testid="story-practice">
                <summary className="cursor-pointer text-sm font-medium text-accent">Questions this could prompt ({s.practice_qs.length})</summary>
                <dl className="mt-2 flex flex-col gap-3">
                  {s.practice_qs.map((pq, j) => <div key={j}><dt className="text-sm font-medium">{pq.q}</dt><dd className="mt-1 text-sm text-muted"><Markdown md={pq.a} /></dd></div>)}
                </dl>
              </details>
              <p className="mt-4 text-xs text-muted" data-testid="story-sources">
                Sources: {s.sources.map((src, j) => <span key={src.url}>{j ? " · " : ""}<a href={src.url} target="_blank" rel="noreferrer" className="underline">{src.title}</a></span>)}
              </p>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
