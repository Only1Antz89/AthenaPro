"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-lg rounded-[28px] bg-white p-10 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Application error</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink">Something failed unexpectedly</h1>
          <p className="mt-4 text-sm text-slate">
            The app hit an error boundary. Reset will retry the current route.
          </p>
          <Button className="mt-6" onClick={reset}>
            Retry
          </Button>
        </div>
      </body>
    </html>
  );
}
