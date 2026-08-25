"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveSourceAction, rejectSourceAction, reprocessSourceAction } from "@/app/admin/corpus/actions";
import type { ContentStatus, SourceKind } from "@/lib/corpus/types";

export function SourceActions({ sourceId, status, kind }: { sourceId: string; status: ContentStatus; kind: SourceKind }) {
  const [pending, start] = useTransition();
  const needsExtraction = kind === "photo" || kind === "pdf";
  return (
    <div className="flex flex-wrap gap-2" data-testid="source-actions">
      <Button size="sm" disabled={pending || status === "approved"} data-testid="approve-source" onClick={() => start(() => approveSourceAction(sourceId))}>
        {status === "approved" ? "Approved" : "Approve all"}
      </Button>
      <Button size="sm" variant="danger" disabled={pending || status === "rejected"} data-testid="reject-source" onClick={() => start(() => rejectSourceAction(sourceId))}>
        Reject
      </Button>
      <Button size="sm" variant="secondary" disabled={pending} data-testid="reprocess-source" onClick={() => start(() => reprocessSourceAction(sourceId))}>
        {needsExtraction ? "Re-extract" : "Re-chunk"}
      </Button>
      {pending && <span className="self-center text-xs text-muted">Working…</span>}
    </div>
  );
}
