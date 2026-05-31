import { cn } from "@/lib/utils";

export function PerformanceBar({
  label,
  value,
  tone = "accent"
}: {
  label: string;
  value: number;
  tone?: "accent" | "success" | "warning";
}) {
  const activeSegments = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-slate">{label}</span>
        <span className="font-medium text-ink">{value.toFixed(1)}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-3 rounded-full border border-white/8 bg-white/[0.05]",
              index < activeSegments &&
                (tone === "success"
                  ? "bg-emerald-400/90"
                  : tone === "warning"
                    ? "bg-amber-300/90"
                    : "bg-accent")
            )}
          />
        ))}
      </div>
    </div>
  );
}
