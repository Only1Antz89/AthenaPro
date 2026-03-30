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
    <Card className="border-dashed bg-slate-50/70 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Ready for next action</p>
      <h3 className="mt-3 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
