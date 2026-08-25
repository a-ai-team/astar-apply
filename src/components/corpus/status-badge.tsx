import { Badge } from "@/components/ui/badge";
import type { ContentStatus } from "@/lib/corpus/types";

export function StatusBadge({ status }: { status: ContentStatus }) {
  const tone = status === "approved" ? "accent" : status === "rejected" ? "danger" : "neutral";
  return (
    <Badge tone={tone} data-testid="status-badge">
      {status.replace("_", " ")}
    </Badge>
  );
}
