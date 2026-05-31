import { cn } from "@/lib/utils";

export function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-line/80 bg-surfaceRaised/75 text-accent outline-none transition focus:ring-4 focus:ring-accent/10",
        props.className
      )}
    />
  );
}
