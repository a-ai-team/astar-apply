"use client";

import { useEffect } from "react";
import { identify } from "@/lib/analytics/client";

/** Ties PostHog's distinct id to the Supabase user id (no email). */
export function IdentifyUser({ userId }: { userId: string | null }) {
  useEffect(() => { identify(userId); }, [userId]);
  return null;
}
