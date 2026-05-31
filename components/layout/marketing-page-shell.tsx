import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function MarketingPageShell({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <SiteHeader />
      <section className="py-10 sm:py-12 md:py-16">
        <PageContainer>
          <div className="section-frame max-w-4xl pl-4 sm:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">{eyebrow}</p>
            <h1 className="mt-4 text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-ink sm:text-5xl md:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate sm:text-lg sm:leading-8">{intro}</p>
          </div>

          <div className="mt-8 sm:mt-10">{children}</div>
        </PageContainer>
      </section>
      <SiteFooter />
    </main>
  );
}
