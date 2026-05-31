import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { BRAND, NAV_LABELS } from "@/lib/brand";
import { SITE_CONTACT } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/60 bg-canvas/80 py-10 backdrop-blur-xl md:py-12">
      <PageContainer className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:gap-8">
        <div>
          <p className="font-display text-lg font-semibold tracking-[0.16em] text-ink sm:text-xl">{BRAND.name}</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-slate">{BRAND.description}</p>
          <p className="mt-3 text-sm text-slate">{SITE_CONTACT.supportEmail}</p>
        </div>

        <div className="space-y-3 text-sm text-slate">
          <p className="font-semibold text-ink">Explore</p>
          <div className="flex flex-col gap-2">
            <Link href="/" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">Home</Link>
            <Link href="/services" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">{NAV_LABELS.services}</Link>
            <Link href="/about" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">{NAV_LABELS.about}</Link>
            <Link href="/contact" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">{NAV_LABELS.contact}</Link>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate">
          <p className="font-semibold text-ink">Platform</p>
          <div className="flex flex-col gap-2">
            <Link href="/jobs" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">{NAV_LABELS.jobs}</Link>
            <Link href="/staff" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">{NAV_LABELS.staff}</Link>
            <Link href="/auth/login" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">{NAV_LABELS.login}</Link>
          </div>
          <p className="pt-2 font-semibold text-ink">Legal</p>
          <div className="flex flex-col gap-2">
            <Link href="/privacy" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">Terms and Conditions</Link>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
