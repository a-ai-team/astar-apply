import Image from "next/image";
import { BrainHalo } from "@/components/chat/brain-halo";
import { Reveal } from "@/components/home/reveal";
import { MENTORS, credentialLine, isSeat, portraitSrc, rosterWithSeats } from "@/content/mentors";

const COLS = 4;

export function MentorGrid() {
  const cells = rosterWithSeats(MENTORS, COLS);
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4" data-testid="mentor-grid">
      {cells.map((cell, i) =>
        isSeat(cell) ? (
          <Reveal key={`seat-${i}`} delay={i * 70} className="flex min-h-[300px] flex-col items-center justify-center gap-5 bg-bg px-6 py-10 text-center" data-testid="mentor-seat">
            <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full border border-dashed border-border" aria-hidden>
              <span className="h-1 w-1 rounded-full bg-muted/60" />
            </span>
            <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">Seat reserved</p>
          </Reveal>
        ) : (
          <Reveal key={cell.slug} delay={i * 70} className="flex min-h-[300px] flex-col items-center bg-bg px-6 py-10 text-center" data-testid="mentor-tile">
            <div className="relative h-[136px] w-[136px]">
              <BrainHalo size={136} state="idle" className="absolute inset-0" />
              <Image src={portraitSrc(cell)} alt={cell.name} width={96} height={96} className="absolute left-1/2 top-1/2 h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover ring-1 ring-accent/40" />
            </div>
            <p className="mt-2 font-display text-[1.5rem] font-medium leading-none tracking-[-0.01em] text-fg">{cell.name}</p>
            <p className="mt-3 max-w-[16rem] text-[0.7rem] uppercase leading-relaxed tracking-[0.14em] text-muted [text-wrap:balance]">{credentialLine(cell)}</p>
            <p className="mt-auto pt-6 font-mono text-[0.65rem] tracking-[0.08em] text-muted">
              {cell.university}{cell.focus[0] ? ` · ${cell.focus[0]}` : ""}{cell.live ? " · live" : ""}
            </p>
          </Reveal>
        ),
      )}
    </div>
  );
}
