import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-panel",
        className
      )}
    >
      {children}
    </div>
  );
}
