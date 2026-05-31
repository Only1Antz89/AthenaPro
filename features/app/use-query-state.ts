"use client";

import { useCallback, useEffect, useState } from "react";

export function useQueryState<T>(query: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    return query()
      .then((result) => {
        setData(result);
        return result;
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "Unexpected error");
        throw nextError;
      })
      .finally(() => {
        setLoading(false);
      });
  }, deps);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    query()
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((nextError: unknown) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Unexpected error");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, deps);

  return { data, loading, error, setData, refresh };
}
