import Image from "next/image";
import Link from "next/link";
import { NeuralField } from "@/components/home/neural-field";
import { Reveal } from "@/components/home/reveal";
import { ScrollStage } from "@/components/home/scroll-progress";
import { MentorGrid } from "@/components/home/mentor-grid";
import { MENTORS, credentialLine, portraitSrc } from "@/content/mentors";

const lead = MENTORS.find((m) => m.live) ?? MENTORS[0];

const primaryCta = "inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-fg transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const ghostCta = "inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm text-fg transition hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[0.7rem] uppercase tracking-[0.16em] text-muted ${className}`}>{children}</p>;
}

export function Hero() {
  return (
    <ScrollStage className="relative isolate overflow-hidden" style={{ minHeight: "calc(100dvh - var(--shell-header-h))" }} data-testid="home-hero">
      <NeuralField className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]" />
      <div className="mx-auto flex min-h-[inherit] w-full max-w-[880px] flex-col items-center justify-center px-6 pb-24 pt-16 text-center md:pt-20" style={{ transform: "translateY(calc(var(--scroll-p, 0) * -28px))" }}>
        <Reveal as="p" className="text-[0.8rem] uppercase tracking-[0.2em] text-muted">A* Apply&nbsp;· Mentor</Reveal>
        <Reveal as="h1" delay={80} className="mt-6 font-display text-[clamp(2.75rem,7.2vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.02em] text-fg [text-wrap:balance]" data-testid="home-heading">
          Ask the people who actually got in.
        </Reveal>
        <Reveal as="p" delay={160} className="mt-7 max-w-xl text-[1.05rem] leading-relaxed text-muted [text-wrap:pretty] md:text-lg">
          Senior students who have done the process, distilled into a mentor you can ask at two in the morning. Cited answers, drawn from their own notes.
        </Reveal>
        <Reveal delay={240} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/home/mentor" className={primaryCta} data-testid="home-mentor-card">Open the Mentor</Link>
          <a href="#mentors" className={ghostCta}>Meet the mentors</a>
        </Reveal>
        <Reveal delay={360} y={10} className="mt-16 flex flex-col items-center">
          <Image src={portraitSrc(lead)} alt={lead.name} width={144} height={144} priority data-field-focus className="h-28 w-28 rounded-full object-cover ring-1 ring-accent/40 shadow-[0_0_48px_-8px_rgba(212,181,113,0.35)] md:h-32 md:w-32" />
          <p className="mt-5 font-display text-[1.35rem] font-medium leading-none tracking-[-0.01em] text-fg">{lead.name}</p>
          <p className="mt-2 max-w-md text-[0.7rem] uppercase tracking-[0.16em] text-muted [text-wrap:balance]">{credentialLine(lead)}</p>
        </Reveal>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center" style={{ opacity: "calc(1 - var(--scroll-p, 0) * 4)" }} aria-hidden>
        <span className="animate-scroll-hint block h-8 w-px bg-gradient-to-b from-transparent via-muted to-transparent" />
      </div>
    </ScrollStage>
  );
}

const REASONS = [
  ["01", "Their material, not the internet's", "Every answer is grounded in what the mentor wrote, taught or was asked in the room — not a scrape of forum folklore."],
  ["02", "Every answer cited", "Each reply points back to the passage it came from, so you can read the original and judge it yourself."],
  ["03", "Says so when it doesn't know", "If the mentor hasn't covered something, the Mentor tells you and gives the standard answer instead of inventing one."],
] as const;

export function Thesis() {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-6 py-28 md:py-36">
      <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <Reveal as="div"><Eyebrow>Why a mentor</Eyebrow></Reveal>
          <Reveal as="h2" delay={80} className="mt-5 font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.015em] text-fg [text-wrap:balance]">
            Generic AI knows what an interview <em className="not-italic text-accent">is</em>. {lead.name.split(" ")[0]} knows what it feels like at nine in the morning on the fourteenth floor.
          </Reveal>
          <Reveal as="p" delay={160} className="mt-6 max-w-md text-muted leading-relaxed [text-wrap:pretty]">
            The gap between a good answer and the answer that gets the offer is usually context: which firms ask it, how far they push, what a strong second-year sounds like. That context lives with people who were just there.
          </Reveal>
        </div>
        <ol className="flex flex-col border-t border-border">
          {REASONS.map(([n, title, body], i) => (
            <Reveal as="li" key={n} delay={i * 110} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border py-7">
              <span className="pt-1 font-mono text-[0.7rem] tracking-[0.1em] text-muted">{n}</span>
              <div>
                <p className="font-display text-[1.35rem] font-medium leading-tight text-fg">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted [text-wrap:pretty]">{body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

const STAGES = [
  ["Collect", "Notes, decks and interview debriefs from the mentor, in their own words.", "sources · pdf · notes · voice"],
  ["Distil", "Indexed passage by passage and voiced from a versioned guide the mentor signs off.", "chunks · embeddings · voice v2"],
  ["Ask", "Streaming answers with citations, and an honest fallback when the corpus runs out.", "cited · streamed · capped"],
] as const;

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface/40">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-24 md:py-32">
        <Reveal><Eyebrow>How it works</Eyebrow></Reveal>
        <Reveal as="h2" delay={80} className="mt-5 max-w-2xl font-display text-[clamp(1.9rem,3.6vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.015em] text-fg [text-wrap:balance]">
          One mentor&rsquo;s material becomes a second brain you can question.
        </Reveal>
        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          <ol className="grid gap-10 md:grid-cols-3 md:gap-6">
            {STAGES.map(([title, body, meta], i) => (
              <Reveal as="li" key={title} delay={i * 140} className="relative">
                <div className="relative mb-6 h-px w-full bg-border">
                  <span data-draw className="absolute inset-0 block bg-fg/60" />
                  <span className="absolute -top-[3px] left-0 h-[7px] w-[7px] rounded-full bg-accent" />
                </div>
                <p className="font-display text-[1.6rem] font-medium leading-none text-fg">{title}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted [text-wrap:pretty]">{body}</p>
                <p className="mt-4 font-mono text-[0.65rem] tracking-[0.08em] text-muted/80">{meta}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={200} y={18} className="hidden lg:block">
            <div className="rounded-2xl border border-border bg-bg/70 p-5 shadow-[0_12px_40px_-20px_rgba(0,0,0,.8)]">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">You</p>
              <p className="mt-2 text-sm text-fg">Why does a higher tax rate not always lower the WACC?</p>
              <p className="mt-6 text-[0.65rem] uppercase tracking-[0.14em] text-muted">Mentor</p>
              <p className="prose-chat mt-2 text-sm text-fg">
                Because the tax shield only helps the debt side. If the firm is already lightly levered, the after-tax cost of debt barely moves and the equity cost of capital dominates…
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[0.7rem] leading-none text-muted">§ Capital structure · p.4</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[0.7rem] leading-none text-muted">Interview debrief · Mar</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Mentors() {
  const first = lead.name.split(" ")[0];
  return (
    <section id="mentors" className="mx-auto w-full max-w-[1100px] scroll-mt-16 px-6 py-28 md:py-36">
      <div className="max-w-2xl">
        <Reveal><Eyebrow>The bench</Eyebrow></Reveal>
        <Reveal as="h2" delay={80} className="mt-5 font-display text-[clamp(2rem,4.4vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.015em] text-fg [text-wrap:balance]">
          {first} is the start.
        </Reveal>
        <Reveal as="p" delay={160} className="mt-5 text-muted leading-relaxed [text-wrap:pretty]">
          Every mentor is a student who got the offer, chosen for what they can teach rather than the name on the badge. The bench grows each term.
        </Reveal>
      </div>
      <div className="mt-14">
        <MentorGrid />
      </div>
    </section>
  );
}

const SUITE = [
  ["/home/technicals", "Technicals", "The textbook for IB technicals that didn't exist.", "home-technicals-card"],
  ["/home/practice", "Practice", "Question bank and spaced-repetition flashcards.", "home-practice-card"],
  ["/home/interviews", "Interviews", "Mock interviews graded against model answers.", "home-interviews-card"],
  ["/home/path", "10-week path", "One plan from first read to final round.", "home-path-card"],
] as const;

export function Suite() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-20 md:py-24">
        <Reveal><Eyebrow>Alongside the Mentor</Eyebrow></Reveal>
        <ul className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {SUITE.map(([href, title, body, tid], i) => (
            <Reveal as="li" key={href} delay={i * 80} className="bg-bg">
              <Link href={href} data-testid={tid} className="group flex h-full flex-col gap-3 p-6 transition hover:bg-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
                <span className="flex items-baseline justify-between">
                  <span className="font-display text-[1.5rem] font-medium leading-none text-fg">{title}</span>
                  <span className="text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-fg" aria-hidden>→</span>
                </span>
                <span className="text-sm leading-relaxed text-muted">{body}</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Closing() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto flex w-full max-w-[880px] flex-col items-center px-6 py-32 text-center md:py-40">
        <Reveal as="h2" className="font-display text-[clamp(2.4rem,5.6vw,4.4rem)] font-medium leading-[1] tracking-[-0.02em] text-fg [text-wrap:balance]">
          Access the absolute best.
        </Reveal>
        <Reveal delay={120} className="mt-10">
          <Link href="/home/mentor" className={primaryCta}>Open the Mentor</Link>
        </Reveal>
        <Reveal as="p" delay={200} className="mt-14 text-[0.7rem] uppercase tracking-[0.16em] text-muted">Built with student mentors&nbsp;· A* AI</Reveal>
      </div>
    </section>
  );
}
