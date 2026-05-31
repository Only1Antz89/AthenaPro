"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

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
      <body className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <div className="panel-shell max-w-lg rounded-[32px] p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">{BRAND.name}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-ink">
            Something failed unexpectedly
          </h1>
          <p className="mt-4 text-sm text-slate">
            The workspace hit an error boundary. Retry will reload the current route.
          </p>
          <Button className="mt-6" onClick={reset}>
            Retry
          </Button>
        </div>
      </body>
    </html>
  );
}
