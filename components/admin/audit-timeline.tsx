import { Card } from "@/components/ui/card";
import type { AuditEntry } from "@/types/admin";
import { formatDateTime } from "@/lib/utils";

export function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  return (
    <Card className="rounded-[26px] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Audit timeline</p>
      <div className="mt-5 space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="border-l border-white/12 pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-ink">{entry.action}</p>
              <span className="text-xs uppercase tracking-[0.16em] text-slate">{entry.entityType}</span>
            </div>
            <p className="mt-1 text-sm text-slate">
              {entry.actorName} • {entry.entityLabel}
            </p>
            <p className="mt-1 text-sm text-slate">{entry.metadata}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate/80">
              {formatDateTime(entry.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
