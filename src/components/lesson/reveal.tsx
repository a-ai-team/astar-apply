"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** "Try first, then tap to check" — hides children until the student clicks. */
export function Reveal({ label = "Reveal", hideLabel = "Hide", testId, children }: { label?: string; hideLabel?: string; testId: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid={`${testId}-toggle`}>
        {open ? hideLabel : label}
      </Button>
      {open && (
        <div className="mt-3" data-testid={`${testId}-content`}>
          {children}
        </div>
      )}
    </div>
  );
}
