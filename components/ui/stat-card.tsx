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
    <Card className="space-y-3">
      <p className="text-sm font-medium text-slate">{label}</p>
      <p className="font-display text-4xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-slate">{hint}</p>
    </Card>
  );
}
