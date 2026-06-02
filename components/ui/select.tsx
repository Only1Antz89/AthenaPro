import { cn } from "@/lib/utils";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-12 w-full min-w-0 max-w-full rounded-[18px] border border-line/70 bg-surfaceRaised/75 px-4 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10",
        props.className
      )}
    />
  );
}
