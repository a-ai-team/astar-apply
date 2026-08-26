"use client";

import type { ReactNode } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics/client";

/** A form that fires an analytics event on submit, then runs the server action. */
export function TrackSubmit({ action, event, props, children, className }: { action: (formData: FormData) => void | Promise<void>; event: AnalyticsEvent; props?: Record<string, string | number | boolean>; children: ReactNode; className?: string }) {
  return <form action={action} onSubmit={() => track(event, props)} className={className}>{children}</form>;
}
