"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getClientDataProvider } from "@/lib/data/provider";
import { getRuntimeMode } from "@/lib/env";
import type { AuthSession } from "@/types/domain";

export function useStaffBook() {
  const provider = useMemo(() => getClientDataProvider(), []);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const nextSession = await provider.getSession();
    setSession(nextSession);
    setLoading(false);
    return nextSession;
  }, [provider]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return {
    provider,
    session,
    loading,
    mode: getRuntimeMode(),
    refreshSession,
    signOut: async () => {
      await provider.signOut();
      setSession(null);
    }
  };
}
