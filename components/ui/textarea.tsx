import { cn } from "@/lib/utils";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[120px] w-full rounded-[18px] border border-line/70 bg-surfaceRaised/75 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate/70 focus:border-accent focus:ring-4 focus:ring-accent/10",
        props.className
      )}
    />
  );
}
