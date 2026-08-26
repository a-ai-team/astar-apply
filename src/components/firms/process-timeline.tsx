// Recruitment process timeline for a firm dossier (Loop 08): ordered stages with when + notes.
import type { Firm } from "@/lib/firms/schema";

export function ProcessTimeline({ process }: { process: Firm["process"] }) {
  if (!process.length) return <p className="text-sm text-muted" data-testid="process-empty">No process details yet.</p>;
  return (
    <ol className="relative flex flex-col gap-4 border-l border-border pl-5" data-testid="process-timeline">
      {process.map((p, i) => (
        <li key={`${i}-${p.stage}`} className="relative" data-testid="process-stage">
          <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-accent bg-bg text-[10px] font-semibold text-accent" aria-hidden>{i + 1}</span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium">{p.stage}</span>
            {p.when && <span className="text-xs text-muted">{p.when}</span>}
          </div>
          {p.notes && <p className="mt-0.5 text-sm text-muted">{p.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
