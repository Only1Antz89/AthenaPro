import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 py-10">
      <PageContainer className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-xl font-semibold">StaffBook Demo</p>
          <p className="mt-1 text-sm text-slate">
            Demo booking and recruitment workflow with production-minded foundations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate">
          <Link href="/jobs">Jobs</Link>
          <Link href="/staff">Staff directory</Link>
          <Link href="/auth/signup">Sign up</Link>
        </div>
      </PageContainer>
    </footer>
  );
}
