"use client";

// <AnalyticsProvider>: mounts Vercel Analytics and initialises PostHog (App Router pattern: init
// once in a client component, capture pageviews on route change). No key → nothing loads.
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { identify, setPosthog } from "@/lib/analytics/client";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

function PostHogPageview({ userId }: { userId: string | null }) {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (!KEY) return;
    let cancelled = false;
    import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      if (!posthog.__loaded) posthog.init(KEY, { api_host: HOST, capture_pageview: false, capture_pageleave: true, persistence: "localStorage+cookie" });
      setPosthog(posthog);
      identify(userId);
    });
    return () => { cancelled = true; };
  }, [userId]);
  useEffect(() => {
    if (!KEY) return;
    import("posthog-js").then(({ default: posthog }) => {
      if (!posthog.__loaded) return;
      const url = search?.toString() ? `${pathname}?${search}` : pathname;
      posthog.capture("$pageview", { $current_url: url });
    });
  }, [pathname, search]);
  return null;
}

export function AnalyticsProvider({ userId }: { userId: string | null }) {
  return (
    <>
      <Analytics />
      <PostHogPageview userId={userId} />
    </>
  );
}
