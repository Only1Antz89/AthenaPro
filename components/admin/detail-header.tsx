import { StatusBadge } from "@/components/admin/status-badge";

export function DetailHeader({
  eyebrow,
  title,
  description,
  status,
  meta,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  status?: string;
  meta?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">{eyebrow}</p>
          {status ? <StatusBadge value={status} /> : null}
        </div>
        <div className="max-w-4xl">
          <h2 className="font-display text-4xl font-semibold tracking-[-0.05em] text-ink">{title}</h2>
          <p className="mt-3 text-base leading-7 text-slate">{description}</p>
          {meta ? <p className="mt-3 text-sm uppercase tracking-[0.16em] text-slate/80">{meta}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
