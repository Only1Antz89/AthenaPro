import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">
          StaffBook Demo
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-ink">
          Page not found
        </h1>
        <p className="mt-4 text-base text-slate">
          The route you asked for does not exist in this demo workspace.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
