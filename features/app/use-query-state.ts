"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useQueryState<T>(query: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    return queryRef.current()
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
    // The caller controls when the query should be refreshed through `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    queryRef.current()
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
    // The query itself is kept current via queryRef without making inline
    // callbacks retrigger the effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData, refresh };
}
