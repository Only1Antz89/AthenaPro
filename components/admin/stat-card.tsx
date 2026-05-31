import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminStatCard({
  label,
  value,
  hint,
  trend
}: {
  label: string;
  value: string | number;
  hint: string;
  trend?: number;
}) {
  const trendTone =
    typeof trend !== "number" ? "text-slate" : trend > 0 ? "text-success" : trend < 0 ? "text-rose" : "text-slate";
  const TrendIcon =
    typeof trend !== "number" ? Minus : trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;

  return (
    <Card className="space-y-5 rounded-[26px] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">{label}</p>
        <div className={cn("inline-flex items-center gap-1 text-xs font-medium", trendTone)}>
          <TrendIcon className="h-3.5 w-3.5" />
          {typeof trend === "number" ? `${Math.abs(trend)}%` : "Stable"}
        </div>
      </div>
      <p className="font-display text-4xl font-semibold tracking-[-0.05em] text-ink">{value}</p>
      <p className="text-sm leading-6 text-slate">{hint}</p>
    </Card>
  );
}
