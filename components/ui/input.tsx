import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full min-w-0 max-w-full rounded-[18px] border border-line/70 bg-surfaceRaised/75 px-4 text-sm text-ink outline-none transition placeholder:text-slate/70 focus:border-accent focus:ring-4 focus:ring-accent/10",
        props.className
      )}
    />
  );
}
