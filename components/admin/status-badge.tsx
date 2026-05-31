import { Badge } from "@/components/ui/badge";

type BadgeVariant = Parameters<typeof Badge>[0]["variant"];

function resolveVariant(value: string): BadgeVariant {
  if (["approved", "verified", "active", "completed", "filled", "paid", "sent", "delivered", "opened", "clicked"].includes(value)) {
    return "success";
  }

  if (["pending", "in_review", "open", "partially_filled", "scheduled", "processing"].includes(value)) {
    return "warning";
  }

  if (["blocked", "rejected", "cancelled", "failed", "inactive", "at_risk", "overdue", "bounced", "complained", "unsubscribed"].includes(value)) {
    return "danger";
  }

  return "neutral";
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge variant={resolveVariant(value)}>{value.replace(/_/g, " ")}</Badge>;
}
