export function logEvent(event: string, metadata?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    // Structured console logs make local debugging easier and can later be swapped for an APM sink.
    console.info(`[staffbook] ${event}`, metadata ?? {});
  }
}
