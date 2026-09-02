"use client";

// Full-bleed "neural field" behind the /home hero — the same vocabulary as the chat halo
// (hairline ivory links, a few gold signals hopping between nodes, nodes warming on arrival)
// spread across the hero as a wide band that thickens towards the wordmark (`[data-field-focus]`). Scroll
// dissolves it: as the hero leaves the viewport the links fade, the signals die out and the
// whole field drifts down slightly. Canvas 2D, no deps; responsive via ResizeObserver;
// reduced-motion → one static frame; paused while the tab is hidden; DPR capped at 2.
import { useEffect, useRef } from "react";
import { GOLD, IVORY, prng } from "@/components/chat/brain-halo";

type Node = { u: number; v: number; p1: number; p2: number; f1: number; f2: number; amp: number; bright: number; x: number; y: number };
type Signal = { from: number; to: number; t: number; speed: number };

const SEED = 0xa5a7;
const IDLE_SIGNALS = 5;

/** Node layout in unit space: a wide lens across the middle plus a cluster around the focus. */
export function layoutNodes(rand: () => number, count: number, focus: { x: number; y: number }): Array<{ u: number; v: number }> {
  const out: Array<{ u: number; v: number }> = [];
  for (let i = 0; i < count; i++) {
    const cluster = rand() < 0.4;
    let u: number, v: number;
    if (cluster) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 0.22;
      u = focus.x + Math.cos(a) * r * 1.35;
      v = focus.y + Math.sin(a) * r * 0.9;
    } else {
      u = 0.03 + rand() * 0.94;
      const spread = 0.34 * Math.sqrt(1 - Math.pow((u - 0.5) * 2, 2) * 0.55);
      v = 0.5 + (rand() + rand() + rand() - 1.5) * spread;
    }
    out.push({ u: Math.min(0.99, Math.max(0.01, u)), v: Math.min(0.99, Math.max(0.01, v)) });
  }
  return out;
}

export function NeuralField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hoverable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0, R = 0;
    let focus = { x: 0.5, y: 0.72 };
    let nodes: Node[] = [];
    const signals: Signal[] = [];
    let rand = prng(SEED);
    let glow: HTMLCanvasElement | null = null;
    const pointer = { x: -1e9, y: -1e9 };

    const focusEl = () => host.querySelector<HTMLElement>("[data-field-focus]");

    const build = () => {
      const rect = host.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const f = focusEl();
      if (f) {
        const fr = f.getBoundingClientRect();
        focus = { x: (fr.left + fr.width / 2 - rect.left) / W, y: (fr.top + fr.height / 2 - rect.top) / H };
      }
      R = Math.min(Math.max(W, H) * 0.085, 150);
      rand = prng(SEED);
      const count = W < 768 ? 64 : W < 1280 ? 110 : 150;
      nodes = layoutNodes(rand, count, focus).map((n) => ({
        ...n, p1: rand() * Math.PI * 2, p2: rand() * Math.PI * 2, f1: 0.05 + rand() * 0.05, f2: 0.03 + rand() * 0.04,
        amp: 2 + rand() * 4, bright: 0, x: 0, y: 0,
      }));
      signals.length = 0;
      const g = document.createElement("canvas");
      const gs = Math.round(Math.min(W, H) * 0.9);
      g.width = g.height = Math.ceil(gs * dpr);
      const gc = g.getContext("2d")!;
      gc.scale(dpr, dpr);
      const grad = gc.createRadialGradient(gs / 2, gs / 2, 0, gs / 2, gs / 2, gs / 2);
      grad.addColorStop(0, `rgba(${GOLD}, 0.10)`);
      grad.addColorStop(0.4, `rgba(${GOLD}, 0.05)`);
      grad.addColorStop(1, `rgba(${GOLD}, 0)`);
      gc.fillStyle = grad;
      gc.fillRect(0, 0, gs, gs);
      glow = g;
    };

    const neighbours = (i: number): number[] => {
      const out: number[] = [];
      const n = nodes[i];
      for (let j = 0; j < nodes.length; j++) {
        if (j === i) continue;
        const dx = nodes[j].x - n.x, dy = nodes[j].y - n.y;
        if (dx * dx + dy * dy < R * R) out.push(j);
      }
      return out;
    };
    const spawn = (): Signal | null => {
      for (let tries = 0; tries < 8; tries++) {
        const from = Math.floor(rand() * nodes.length);
        const nb = neighbours(from);
        if (nb.length) return { from, to: nb[Math.floor(rand() * nb.length)], t: rand() * 0.5, speed: 0.45 + rand() * 0.4 };
      }
      return null;
    };
    const hop = (s: Signal) => {
      const nb = neighbours(s.to).filter((j) => j !== s.from);
      if (!nb.length) { const fresh = spawn(); if (fresh) Object.assign(s, fresh); return; }
      // Bias hops towards the focus so traffic reads as converging on the portrait.
      const fx = focus.x * W, fy = focus.y * H;
      nb.sort((a, b) => Math.hypot(nodes[a].x - fx, nodes[a].y - fy) - Math.hypot(nodes[b].x - fx, nodes[b].y - fy));
      const pick = rand() < 0.6 ? nb[Math.floor(rand() * Math.min(3, nb.length))] : nb[Math.floor(rand() * nb.length)];
      s.from = s.to; s.to = pick; s.t = 0; s.speed = 0.45 + rand() * 0.4;
    };

    const place = (time: number, drop: number) => {
      for (const n of nodes) {
        let x = n.u * W + Math.sin(time * n.f1 + n.p1) * n.amp;
        let y = n.v * H + Math.cos(time * n.f2 + n.p2) * n.amp * 0.7 + drop;
        if (hoverable) {
          const dx = pointer.x - x, dy = pointer.y - y;
          const d2 = dx * dx + dy * dy;
          const reach = 220;
          if (d2 < reach * reach) {
            const d = Math.sqrt(d2) || 1;
            const k = (1 - d / reach) * 6;
            x += (dx / d) * k; y += (dy / d) * k;
          }
        }
        n.x = x; n.y = y;
      }
    };

    const draw = (time: number, dt: number, progress: number) => {
      const fade = 1 - Math.min(1, progress * 1.35);
      const ease = fade * fade;
      place(time, progress * 48);

      const wanted = Math.round(IDLE_SIGNALS * ease);
      while (signals.length < wanted) { const s = spawn(); if (!s) break; signals.push(s); }
      while (signals.length > wanted) signals.pop();

      ctx.clearRect(0, 0, W, H);
      if (glow && ease > 0.01) {
        const gs = Math.min(W, H) * 0.9;
        ctx.globalAlpha = ease * (0.85 + 0.15 * Math.sin(time * 0.6));
        ctx.drawImage(glow, focus.x * W - gs / 2, focus.y * H - gs / 2 + progress * 48, gs, gs);
        ctx.globalAlpha = 1;
      }

      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= R * R) continue;
          const d = Math.sqrt(d2);
          const alpha = (0.07 + 0.09 * (1 - d / R)) * ease;
          if (alpha < 0.004) continue;
          ctx.strokeStyle = `rgba(${IVORY}, ${alpha})`;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
        }
      }

      for (const s of signals) {
        s.t += dt * s.speed;
        if (s.t >= 1) { nodes[s.to].bright = 1; hop(s); }
        const a = nodes[s.from], b = nodes[s.to];
        const x = a.x + (b.x - a.x) * s.t, y = a.y + (b.y - a.y) * s.t;
        const tail = Math.max(0, s.t - 0.25);
        const tx = a.x + (b.x - a.x) * tail, ty = a.y + (b.y - a.y) * tail;
        const grad = ctx.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, `rgba(${GOLD}, 0)`);
        grad.addColorStop(1, `rgba(${GOLD}, ${0.7 * ease})`);
        ctx.strokeStyle = grad; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = `rgba(${GOLD}, ${0.95 * ease})`;
        ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
      }

      for (const n of nodes) {
        n.bright *= Math.exp(-dt * 1.4);
        const b = n.bright;
        const base = 0.22 * ease;
        ctx.fillStyle = b > 0.02 ? `rgba(${GOLD}, ${(0.3 + b * 0.7) * ease})` : `rgba(${IVORY}, ${base})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 0.9 + b * 1.1, 0, Math.PI * 2); ctx.fill();
      }
    };

    const progressNow = () => {
      const r = host.getBoundingClientRect();
      return r.height > 0 ? Math.min(1, Math.max(0, -r.top / r.height)) : 0;
    };

    build();
    const ro = new ResizeObserver(() => { build(); if (reduced) draw(0, 0, 0); });
    ro.observe(host);

    if (reduced) { draw(0, 0, 0); return () => ro.disconnect(); }

    const onMove = (e: PointerEvent) => { const r = host.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; };
    const onLeave = () => { pointer.x = -1e9; pointer.y = -1e9; };
    if (hoverable) { host.addEventListener("pointermove", onMove, { passive: true }); host.addEventListener("pointerleave", onLeave); }

    let raf = 0;
    let last = performance.now();
    let hidden = document.hidden;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!hidden) {
        const p = progressNow();
        if (p < 1) draw(now / 1000, dt, p);
      }
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => { hidden = document.hidden; last = performance.now(); };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden data-testid="neural-field" />;
}
