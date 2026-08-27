"use client";

// Fire-on-mount event helpers for server-rendered pages.
import { useEffect } from "react";
import { track } from "@/lib/analytics/client";

export function SubscribedEvent({ plan }: { plan: string }) {
  useEffect(() => {
    const key = `astar_subscribed_${plan}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* private mode */ }
    track("subscribed", { plan });
  }, [plan]);
  return null;
}
