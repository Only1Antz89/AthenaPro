import { PageContainer } from "@/components/layout/page-container";

export function DashboardShell({
  title,
  eyebrow,
  description,
  children
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-12">
      <PageContainer>
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink">{title}</h1>
          <p className="mt-3 text-base text-slate">{description}</p>
        </div>
        {children}
      </PageContainer>
    </div>
  );
}
