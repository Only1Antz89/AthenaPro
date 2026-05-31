import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  value,
  size = "sm"
}: {
  value: number;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < Math.round(value);
        return (
          <Star
            key={index}
            className={cn(
              "fill-current",
              active ? "text-gold" : "text-white/10",
              size === "md" ? "h-5 w-5" : "h-4 w-4"
            )}
          />
        );
      })}
      <span className="ml-1 text-sm font-medium text-slate">{value.toFixed(1)}</span>
    </div>
  );
}
