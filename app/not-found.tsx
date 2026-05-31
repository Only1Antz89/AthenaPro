import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="panel-shell w-full max-w-lg rounded-[32px] p-10 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">{BRAND.name}</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-ink">Page not found</h1>
        <p className="mt-4 text-base text-slate">
          The route you asked for does not exist in this workspace.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-mist px-5 py-3 text-sm font-semibold text-canvas"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
