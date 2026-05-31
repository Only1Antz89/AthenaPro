import { AdminStatCard } from "@/components/admin/stat-card";

export function KpiGrid({
  items
}: {
  items: Array<{
    label: string;
    value: string | number;
    hint: string;
    trend?: number;
  }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <AdminStatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
