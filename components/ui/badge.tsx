import { cn } from "@/lib/utils";

const variants = {
  neutral: "text-slate",
  success: "text-success",
  warning: "text-gold",
  danger: "text-rose",
  accent: "text-mist"
};

export function Badge({
  children,
  variant = "neutral"
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] before:block before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-['']",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}
