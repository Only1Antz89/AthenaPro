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
    <div className="py-10 sm:py-12 md:py-16">
      <PageContainer>
        <div className="section-frame mb-8 max-w-3xl pl-4 sm:mb-10 sm:pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">{eyebrow}</p>
          <h1 className="mt-4 text-balance font-display text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate sm:text-base">{description}</p>
        </div>
        {children}
      </PageContainer>
    </div>
  );
}
