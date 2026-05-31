import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">{label}</p>
      <p className="font-display text-4xl font-semibold tracking-[-0.05em] text-ink">{value}</p>
      <p className="max-w-[18rem] text-sm leading-6 text-slate">{hint}</p>
    </Card>
  );
}
