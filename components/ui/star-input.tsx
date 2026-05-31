"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarInput({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const score = index + 1;
        return (
          <button
            key={score}
            type="button"
            className="rounded-full p-1 transition hover:scale-110"
            onClick={() => onChange(score)}
          >
            <Star
              className={cn("h-6 w-6", score <= value ? "fill-gold text-gold" : "text-white/16")}
            />
          </button>
        );
      })}
    </div>
  );
}
