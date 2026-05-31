import { cn } from "@/lib/utils";

export function RankingBadge({ score }: { score: number }) {
  const tone =
    score >= 4.6 ? "bg-success/12 text-success" : score >= 4.2 ? "bg-gold/12 text-gold" : "bg-white/[0.05] text-slate";

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", tone)}>
      Score {score.toFixed(2)}
    </span>
  );
}
