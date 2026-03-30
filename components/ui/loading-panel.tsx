import { Card } from "@/components/ui/card";

export function LoadingPanel({ label = "Loading..." }: { label?: string }) {
  return (
    <Card className="animate-pulse">
      <div className="h-4 w-28 rounded-full bg-slate-200" />
      <div className="mt-4 h-8 w-2/3 rounded-full bg-slate-200" />
      <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
      <div className="mt-2 h-4 w-3/4 rounded-full bg-slate-100" />
      <p className="mt-6 text-sm text-slate">{label}</p>
    </Card>
  );
}
