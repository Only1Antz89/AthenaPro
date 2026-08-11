import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { BRAND } from "@/lib/brand";
import { SITE_CONTACT } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/60 bg-canvas/80 py-10 backdrop-blur-xl md:py-12">
      <PageContainer className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.75fr_0.75fr_0.75fr] lg:gap-8">
        <div>
          <p className="font-display text-lg font-semibold tracking-[0.16em] text-ink sm:text-xl">{BRAND.name}</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-slate">{BRAND.description}</p>
          <p className="mt-3 text-sm text-slate">{SITE_CONTACT.supportEmail}</p>
        </div>

        <div className="space-y-3 text-sm text-slate">
          <p className="font-semibold text-ink">For event staff</p>
          <div className="flex flex-col gap-2">
            <Link href="/jobs" className="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">Find work</Link>
            <Link href="/staff" className="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">How it works</Link>
            <Link href="/auth/signup?type=field-team" className="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">Join the field team</Link>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate">
          <p className="font-semibold text-ink">For employers</p>
          <div className="flex flex-col gap-2">
            <Link href="/services" className="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">Services</Link>
            <Link href="/contact" className="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">Hire event staff</Link>
            <Link href="/auth/signup?type=company" className="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">Employer account</Link>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate">
          <p className="font-semibold text-ink">Athena Pro</p>
          <div className="flex flex-col gap-2">
            <Link href="/about" className="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">About</Link>
            <Link href="/auth/login" className="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">Sign in</Link>
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
