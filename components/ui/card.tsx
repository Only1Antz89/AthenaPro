import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("panel-shell rounded-[24px] p-5 sm:rounded-[28px] sm:p-6", className)}>{children}</div>;
}
