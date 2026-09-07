import { Badge } from "@/components/ui/badge";
import type { BatchStatus } from "@/lib/api";

const LABELS: Record<BatchStatus, { label: string; className: string }> = {
  importing: { label: "Checking", className: "bg-secondary text-secondary-foreground" },
  needs_review: { label: "Needs attention", className: "bg-[#f2b640] text-[#17271f]" },
  ready: { label: "Ready", className: "bg-primary text-primary-foreground" },
  failed: { label: "Failed", className: "bg-destructive text-white" },
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const { label, className } = LABELS[status];
  return <Badge className={className}>{label}</Badge>;
}
