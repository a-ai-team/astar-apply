"use client";

// Analytics (Loop 10): one `track()` for the five product events. PostHog when
// NEXT_PUBLIC_POSTHOG_KEY is set (initialised by <AnalyticsProvider>), Vercel Analytics custom
// events always (a no-op outside Vercel). Never throws; never sends PII beyond what PostHog gets
// from `identify` (email is NOT sent — the Supabase user id is the distinct id).
import { track as vercelTrack } from "@vercel/analytics";
import type posthog from "posthog-js";

export type AnalyticsEvent = "signup" | "lesson_complete" | "chat_message" | "checkout_started" | "subscribed";
export const ANALYTICS_EVENTS: AnalyticsEvent[] = ["signup", "lesson_complete", "chat_message", "checkout_started", "subscribed"];

type Props = Record<string, string | number | boolean | null | undefined>;

let ph: typeof posthog | null = null;

export function setPosthog(client: typeof posthog | null) {
  ph = client;
}

export function track(event: AnalyticsEvent, props: Props = {}) {
  try {
    const clean = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) as Record<string, string | number | boolean | null>;
    ph?.capture(event, clean);
    vercelTrack(event, clean);
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") (window as unknown as { __astarEvents?: unknown[] }).__astarEvents = [...(((window as unknown as { __astarEvents?: unknown[] }).__astarEvents) ?? []), { event, props: clean }];
  } catch {
    // analytics must never break the app
  }
}

export function identify(userId: string | null) {
  try {
    if (!ph) return;
    if (userId) ph.identify(userId);
    else ph.reset();
  } catch {
    // ignore
  }
}
