"use client";

// "Second brain" halo behind the mentor portrait: a deterministic constellation of hairline links
// on the upper arc, with a few gold signals hopping between nodes. `thinking` doubles the signals,
// lifts the link alpha and fades in a soft gold glow behind the portrait. Canvas only, no deps.
// Honours prefers-reduced-motion (one static frame), pauses while the tab is hidden, DPR-aware.
import { useEffect, useRef } from "react";

type State = "idle" | "thinking";
type Node = { a: number; r: number; da: number; dr: number; p1: number; p2: number; f1: number; f2: number; bright: number; x: number; y: number };
type Signal = { from: number; to: number; t: number; speed: number };

const NODE_COUNT = 56;
const ARC = (230 * Math.PI) / 180;
const LINK_RANGE = 0.28;
const IDLE_SIGNALS = 3;
const IVORY = "239, 233, 220";
const GOLD = "212, 181, 113";

/** mulberry32 — small seeded PRNG so every mount draws the same constellation. */
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNodes(rand: () => number): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const t = (i + 0.5) / NODE_COUNT + (rand() - 0.5) * 0.9 / NODE_COUNT;
    const a = -Math.PI / 2 + (t - 0.5) * ARC;
    const r = 0.55 + Math.sqrt(rand()) * 0.4;
    nodes.push({ a, r, da: 0.012 + rand() * 0.014, dr: 0.008 + rand() * 0.012, p1: rand() * Math.PI * 2, p2: rand() * Math.PI * 2, f1: 0.05 + rand() * 0.06, f2: 0.03 + rand() * 0.05, bright: 0, x: 0, y: 0 });
  }
  return nodes;
}

function neighbours(nodes: Node[], i: number, R: number): number[] {
  const out: number[] = [];
  const n = nodes[i];
  const max = LINK_RANGE * R;
  for (let j = 0; j < nodes.length; j++) {
    if (j === i) continue;
    const dx = nodes[j].x - n.x, dy = nodes[j].y - n.y;
    if (dx * dx + dy * dy < max * max) out.push(j);
  }
  return out;
}

function glowSprite(size: number, dpr: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(size * dpr);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${GOLD}, 0.34)`);
  grad.addColorStop(0.45, `rgba(${GOLD}, 0.10)`);
  grad.addColorStop(1, `rgba(${GOLD}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export function BrainHalo({ size, state, className }: { size: number; state: State; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = size / 2;
    const rand = prng(0x5eed + size);
    const nodes = makeNodes(rand);
    const glow = glowSprite(size * 0.62, dpr);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const signals: Signal[] = [];
    let intensity = stateRef.current === "thinking" ? 1 : 0;

    const place = (time: number) => {
      for (const n of nodes) {
        const a = n.a + Math.sin(time * n.f1 + n.p1) * n.da + Math.sin(time * n.f2 + n.p2) * n.da * 0.5;
        const r = (n.r + Math.sin(time * n.f2 + n.p1) * n.dr) * R;
        n.x = R + Math.cos(a) * r;
        n.y = R + Math.sin(a) * r;
      }
    };
    const spawn = (): Signal | null => {
      for (let tries = 0; tries < 8; tries++) {
        const from = Math.floor(rand() * nodes.length);
        const nb = neighbours(nodes, from, R);
        if (nb.length) return { from, to: nb[Math.floor(rand() * nb.length)], t: rand() * 0.5, speed: 0.55 + rand() * 0.45 };
      }
      return null;
    };
    const hop = (s: Signal) => {
      const nb = neighbours(nodes, s.to, R).filter((j) => j !== s.from);
      const next = nb.length ? nb[Math.floor(rand() * nb.length)] : null;
      if (next === null) { const fresh = spawn(); if (fresh) Object.assign(s, fresh); return; }
      s.from = s.to; s.to = next; s.t = 0; s.speed = 0.55 + rand() * 0.45;
    };

    const draw = (time: number, dt: number) => {
      place(time);
      const target = stateRef.current === "thinking" ? 1 : 0;
      intensity += (target - intensity) * Math.min(1, dt * 2.2);
      const wanted = IDLE_SIGNALS + Math.round(intensity * IDLE_SIGNALS) + (intensity > 0.5 ? 1 : 0);
      while (signals.length < wanted) { const s = spawn(); if (!s) break; signals.push(s); }
      while (signals.length > wanted) signals.pop();

      ctx.clearRect(0, 0, size, size);
      if (intensity > 0.01) {
        ctx.globalAlpha = intensity * (0.8 + 0.2 * Math.sin(time * 1.1));
        const g = size * 0.62;
        ctx.drawImage(glow, R - g / 2, R - g / 2, g, g);
        ctx.globalAlpha = 1;
      }

      // Hairline links.
      const max = LINK_RANGE * R;
      const linkBoost = 1 + intensity * 0.5;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d >= max) continue;
          const alpha = (0.10 + 0.08 * (1 - d / max)) * linkBoost;
          ctx.strokeStyle = `rgba(${IVORY}, ${alpha})`;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
        }
      }

      // Signals: a gold dot with a short trailing gradient along the link.
      for (const s of signals) {
        s.t += dt * s.speed;
        if (s.t >= 1) { nodes[s.to].bright = 1; hop(s); }
        const a = nodes[s.from], b = nodes[s.to];
        const x = a.x + (b.x - a.x) * s.t, y = a.y + (b.y - a.y) * s.t;
        const tail = Math.max(0, s.t - 0.22);
        const tx = a.x + (b.x - a.x) * tail, ty = a.y + (b.y - a.y) * tail;
        const grad = ctx.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, `rgba(${GOLD}, 0)`);
        grad.addColorStop(1, `rgba(${GOLD}, 0.7)`);
        ctx.strokeStyle = grad; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = `rgba(${GOLD}, 0.95)`;
        ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.fill();
      }

      // Nodes: ivory points, warming to gold as a signal arrives, then decaying.
      for (const n of nodes) {
        n.bright *= Math.exp(-dt * 1.6);
        const b = n.bright;
        ctx.fillStyle = b > 0.02 ? `rgba(${GOLD}, ${0.3 + b * 0.7})` : `rgba(${IVORY}, 0.28)`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 0.9 + b * 0.9, 0, Math.PI * 2); ctx.fill();
      }
    };

    if (reduced) { draw(0, 0); return; }

    let raf = 0;
    let last = performance.now();
    let hidden = document.hidden;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!hidden) draw(now / 1000, dt);
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => { hidden = document.hidden; last = performance.now(); };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); };
  }, [size]);

  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size }} className={className} aria-hidden data-testid="brain-halo" data-state={state} />;
}
