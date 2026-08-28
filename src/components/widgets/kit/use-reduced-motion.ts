"use client";

import { useSyncExternalStore } from "react";

/**
 * True when the reader has asked for reduced motion. Widgets swap their animations for a
 * step-through control and a textual diff (docs/research/technicals-v2/01-interactive-teaching.md § 5).
 *
 * `matchMedia` is an external store, so `useSyncExternalStore` is the right primitive: it is
 * SSR-safe (the server snapshot is "not reduced") and re-renders when the setting changes.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
