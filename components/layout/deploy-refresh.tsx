"use client";

import { useEffect } from "react";

const STORAGE_KEY = "athena-pro-deploy-version";
const CHECK_INTERVAL_MS = 60_000;

type DeployVersionResponse = {
  version?: string;
};

export function DeployRefresh() {
  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    async function checkVersion() {
      try {
        const response = await fetch("/api/deploy-version", {
          cache: "no-store"
        });

        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as DeployVersionResponse;
        const nextVersion = data.version;

        if (!nextVersion || cancelled) {
          return;
        }

        const currentVersion = window.localStorage.getItem(STORAGE_KEY);

        if (!currentVersion) {
          window.localStorage.setItem(STORAGE_KEY, nextVersion);
          return;
        }

        if (currentVersion !== nextVersion) {
          window.localStorage.setItem(STORAGE_KEY, nextVersion);
          window.location.reload();
        }
      } catch {
        // Version checks should never interrupt the current page.
      }
    }

    void checkVersion();
    intervalId = window.setInterval(checkVersion, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return null;
}
