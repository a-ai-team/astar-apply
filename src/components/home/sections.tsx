import Link from "next/link";
import type { ReactNode } from "react";
import { HeroBrand } from "@/components/home/hero-brand";
import { NeuralField } from "@/components/home/neural-field";
import { Reveal } from "@/components/home/reveal";
import { ScrollStage } from "@/components/home/scroll-progress";
import { MentorGrid } from "@/components/home/mentor-grid";
import { MENTORS } from "@/content/mentors";
import { CHAT_MOCK, IN_THE_WORKS, PATH_WEEKS, REASONS, ROUTE, TOOLKIT } from "@/content/home";

// The /home landing: one integrated toolkit for the spring-week / summer-internship route.
// Sections: Hero · Toolkit · Route · Path · Mentor · InTheWorks · Closing (src/app/home/page.tsx).
// Copy and data live in src/content/home.ts; the roster in src/content/mentors.ts.

const lead = MENTORS.find((m) => m.live) ?? MENTORS[0];

const primaryCta = "inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-fg transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const ghostCta = "inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm text-fg transition hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const chip = "inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[0.7rem] leading-none text-muted transition hover:border-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const container = "mx-auto w-full max-w-[1100px] px-6";

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[0.7rem] uppercase tracking-[0.16em] text-muted ${className}`}>{children}</p>;
}

function SectionHead({ eyebrow, title, lead, children }: { eyebrow: string; title?: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>
      {title && (
        <Reveal as="h2" delay={80} className="mt-5 font-display text-[clamp(1.9rem,3.8vw,2.8rem)] font-medium leading-[1.05] tracking-[-0.015em] text-fg [text-wrap:balance]">
          {title}
        </Reveal>
      )}
      {lead && (
        <Reveal as="p" delay={160} className="mt-5 text-muted leading-relaxed [text-wrap:pretty]">
          {lead}
        </Reveal>
      )}
      {children}
    </div>
  );
}

export function Hero() {
  return (
    <ScrollStage className="relative isolate overflow-hidden" style={{ minHeight: "calc(100dvh - var(--shell-header-h))" }} data-testid="home-hero">
      <NeuralField className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]" />
      <div className="mx-auto flex min-h-[inherit] w-full max-w-[880px] flex-col items-center justify-center px-6 pb-20 pt-8 text-center md:pt-10" style={{ transform: "translateY(calc(var(--scroll-p, 0) * -28px))" }}>
        {/* The wordmark is the LCP element — kept out of <Reveal> so it never starts at opacity 0. */}
        <HeroBrand className="w-[min(72vw,440px)]" />
        <Reveal as="p" delay={80} className="mt-8 text-[0.72rem] uppercase tracking-[0.2em] text-muted [text-wrap:balance]">
          Spring weeks&nbsp;· Summer internships&nbsp;· Investment banking
        </Reveal>
        <Reveal as="h1" delay={160} className="mt-5 font-display text-[clamp(2.4rem,6vw,4.2rem)] font-medium leading-[0.98] tracking-[-0.02em] text-fg [text-wrap:balance]" data-testid="home-heading">
          Everything between you and the offer.
        </Reveal>
        <Reveal as="p" delay={240} className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-muted [text-wrap:pretty] md:text-lg">
          Lessons, a question bank, mock interviews and a mentor who has done it, built around the spring week and summer internship process. One place, from the first application to the last round.
        </Reveal>
        <Reveal delay={320} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/home/path" className={primaryCta} data-testid="hero-cta-path">Start the 10-week path</Link>
          <Link href="/home/mentor" className={ghostCta} data-testid="hero-cta-mentor">Ask the Mentor</Link>
        </Reveal>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center" style={{ opacity: "calc(1 - var(--scroll-p, 0) * 4)" }} aria-hidden>
        <span className="animate-scroll-hint block h-8 w-px bg-gradient-to-b from-transparent via-muted to-transparent" />
      </div>
    </ScrollStage>
  );
}

export function Toolkit() {
  return (
    <section id="toolkit" className={`${container} scroll-mt-16 py-24 md:py-32`}>
      <SectionHead eyebrow="The toolkit" title="Four tools. One route." lead="Each part covers a stage of the process and points to the others when you need them." />
      <ul className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {TOOLKIT.map((t, i) => (
          <Reveal as="li" key={t.href} delay={i * 80} className="bg-bg">
            <Link href={t.href} data-testid={t.testId} className="group flex h-full min-h-[12rem] flex-col gap-3 p-6 transition hover:bg-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
              <span className="flex items-baseline justify-between">
                <span className="font-display text-[1.6rem] font-medium leading-none text-fg">{t.title}</span>
                <span className="text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-fg" aria-hidden>→</span>
              </span>
              <span className="text-sm leading-relaxed text-muted [text-wrap:pretty]">{t.body}</span>
              <span className="mt-auto pt-4 font-mono text-[0.65rem] tracking-[0.08em] text-muted/80">
                {t.href === "/home/mentor" ? `${lead.name} · ${lead.university} · ${t.facts.split(" · ")[0]}` : t.facts}
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function Route() {
  return (
    <section id="route" className="border-t border-border">
      <div className={`${container} py-24 md:py-32`}>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHead eyebrow="The process" title="Every stage, covered." lead="A spring week or summer internship runs the same five stages at almost every bank. Each one maps to something here." />
          <Reveal as="ol" className="relative flex flex-col" data-testid="home-route">
            <span className="absolute inset-x-0 top-0 h-px bg-border" aria-hidden><span data-draw className="absolute inset-0 block bg-fg/60" /></span>
            {ROUTE.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 90} className="grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-3 border-b border-border py-7 md:grid-cols-[2.5rem_1.15fr_1fr] md:gap-x-6">
                <span className="pt-1 font-mono text-[0.7rem] tracking-[0.1em] text-muted">{s.n}</span>
                <div>
                  <p className="font-display text-[1.35rem] font-medium leading-tight text-fg">{s.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted [text-wrap:pretty]">{s.body}</p>
                </div>
                <div className="col-start-2 flex flex-wrap content-start gap-2 md:col-start-3 md:justify-end md:pt-1">
                  {s.chips.map((c) => (
                    <Link key={c.label} href={c.href} className={chip}>{c.label}</Link>
                  ))}
                </div>
              </Reveal>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Path() {
  return (
    <section id="path" className="border-y border-border bg-surface/40">
      <div className={`${container} py-24 md:py-32`}>
        <SectionHead eyebrow="The spine" title="Ten weeks, in the order the interview asks." lead="Foundations first, then accounting, then the valuation chain, each week building on the last. Every chapter closes with a printable cheat sheet.">
          <Reveal delay={240} className="mt-6">
            <Link href="/home/path" data-testid="home-path-card" className="group inline-flex items-center gap-2 text-sm text-fg transition hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              See the path
              <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
            </Link>
          </Reveal>
        </SectionHead>
        <Reveal as="ol" delay={200} className="mt-14 grid grid-cols-2 gap-y-8 sm:grid-cols-5 lg:grid-cols-10" data-testid="home-path-spine">
          {PATH_WEEKS.map((w) => (
            <li key={w.week} className="relative border-t border-border pr-3 pt-4">
              <span data-draw className="absolute -top-px left-0 block h-px w-full bg-fg/50" aria-hidden />
              <span className="absolute -top-[3px] left-0 h-[7px] w-[7px] rounded-full bg-accent" aria-hidden />
              <p className="font-mono text-[0.65rem] tracking-[0.1em] text-muted">W{w.week}</p>
              <p className="mt-1.5 text-sm leading-tight text-fg">{w.label}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function Mentor() {
  const first = lead.name.split(" ")[0];
  return (
    <section id="mentors" className={`${container} scroll-mt-16 py-24 md:py-32`}>
      <SectionHead
        eyebrow="The Mentor"
        title="Ask the people who actually got in."
        lead={<>Every answer is drawn from the mentor&rsquo;s own notes and the curriculum, and says where it came from. Ask about applications, networking, tests or the assessment centre, or press &ldquo;Ask Mentor about this&rdquo; from any lesson, question or card.</>}
      />
      <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <ol className="flex flex-col border-t border-border">
          {REASONS.map((r, i) => (
            <Reveal as="li" key={r.n} delay={i * 110} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-border py-7">
              <span className="pt-1 font-mono text-[0.7rem] tracking-[0.1em] text-muted">{r.n}</span>
              <div>
                <p className="font-display text-[1.35rem] font-medium leading-tight text-fg">{r.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted [text-wrap:pretty]">{r.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={200} y={18} className="self-start">
          <div className="rounded-2xl border border-border bg-bg/70 p-5 shadow-[0_12px_40px_-20px_rgba(0,0,0,.8)]" aria-label="Example exchange with the Mentor">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">You</p>
            <p className="mt-2 text-sm text-fg">{CHAT_MOCK.question}</p>
            <p className="mt-6 text-[0.65rem] uppercase tracking-[0.14em] text-muted">Mentor</p>
            <p className="prose-chat mt-2 text-sm text-fg">{CHAT_MOCK.answer}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CHAT_MOCK.chips.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[0.7rem] leading-none text-muted">{c}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
      <div className="mt-24 md:mt-28">
        <Reveal><Eyebrow>The bench</Eyebrow></Reveal>
        <Reveal as="p" delay={80} className="mt-4 max-w-2xl text-muted leading-relaxed [text-wrap:pretty]">
          {first} is the first. The bench grows each term, and every seat is a student who got the offer.
        </Reveal>
        <div className="mt-10">
          <MentorGrid />
        </div>
      </div>
    </section>
  );
}

export function InTheWorks() {
  return (
    <section className="border-t border-border">
      <div className={`${container} py-20 md:py-24`}>
        <Reveal><Eyebrow>In the works</Eyebrow></Reveal>
        <Reveal as="p" delay={80} className="mt-4 max-w-2xl text-sm text-muted leading-relaxed">
          Built or being built, shown so you know what is coming.
        </Reveal>
        <ul className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3" data-testid="home-works">
          {IN_THE_WORKS.map((w, i) => (
            <Reveal as="li" key={w.title} delay={i * 80} className="flex flex-col gap-3 bg-bg p-6">
              <span className="flex items-baseline justify-between gap-4">
                <span className="font-display text-[1.4rem] font-medium leading-none text-fg/85">{w.title}</span>
                <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted">{w.tag}</span>
              </span>
              <span className="text-sm leading-relaxed text-muted [text-wrap:pretty]">{w.body}</span>
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
          Start with week one.
        </Reveal>
        <Reveal delay={120} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/home/path" className={primaryCta}>Start the 10-week path</Link>
          <Link href="/home/mentor" className={ghostCta}>Ask the Mentor</Link>
        </Reveal>
        <Reveal as="p" delay={200} className="mt-14 text-[0.7rem] uppercase tracking-[0.16em] text-muted">Built with student mentors&nbsp;· A* AI</Reveal>
      </div>
    </section>
  );
}
