import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed border-white/10 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
        Ready for next action
      </p>
      <h3 className="mt-3 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
