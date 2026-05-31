import { Card } from "@/components/ui/card";

export function FilterToolbar({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <Card className="rounded-[26px] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
            Active filters
          </p>
          <h2 className="mt-2 text-lg font-semibold text-ink">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${item.label}-${item.value}`}
              className="rounded-full bg-white/[0.05] px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate ring-1 ring-white/8"
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
