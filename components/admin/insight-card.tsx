import { Card } from "@/components/ui/card";

export function InsightCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[28px] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">{title}</p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate">{description}</p>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
