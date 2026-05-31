import Link from "next/link";
import { Card } from "@/components/ui/card";

export function TabbedDetailLayout({
  tabs,
  children
}: {
  tabs: Array<{ label: string; href: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <Card className="rounded-[26px] p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-full bg-white/[0.04] px-4 py-2 text-sm text-slate transition hover:bg-white/[0.08] hover:text-ink"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </Card>
      {children}
    </div>
  );
}
