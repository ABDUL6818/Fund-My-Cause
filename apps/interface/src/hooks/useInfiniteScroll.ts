"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  /** Max auto-retry attempts per failed page. Defaults to 3. */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff. Defaults to 1000. */
  retryBaseDelay?: number;
}

export interface UseInfiniteScrollReturn {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  error: Error | null;
  /** Manually trigger a retry of the last failed page load. */
  retry: () => void;
  reset: () => void;
}

export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  hasMore: boolean,
  options: UseInfiniteScrollOptions = {},
): UseInfiniteScrollReturn {
  const {
    threshold = 0.1,
    rootMargin = "100px",
    maxRetries = 3,
    retryBaseDelay = 1000,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetryTimer = () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const load = useCallback(
    async (isRetry = false) => {
      if (isLoadingRef.current || !hasMore) return;
      isLoadingRef.current = true;
      setIsLoading(true);
      if (!isRetry) {
        // Reset retry count on a fresh (non-retry) load attempt
        retryCountRef.current = 0;
      }
      setError(null);
      try {
        await loadMore();
        retryCountRef.current = 0;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);

        // Schedule auto-retry with exponential backoff if under the limit
        if (retryCountRef.current < maxRetries) {
          const delay = retryBaseDelay * 2 ** retryCountRef.current;
          retryCountRef.current += 1;
          clearRetryTimer();
          retryTimerRef.current = setTimeout(() => {
            isLoadingRef.current = false; // allow re-entry
            load(true);
          }, delay);
        }
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [loadMore, hasMore, maxRetries, retryBaseDelay],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !error) {
          load();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [load, threshold, rootMargin, error]);

  // Cleanup pending retry timer on unmount
  useEffect(() => () => clearRetryTimer(), []);

  /** Manual retry — resets backoff counter. */
  const retry = useCallback(() => {
    clearRetryTimer();
    retryCountRef.current = 0;
    isLoadingRef.current = false;
    setError(null);
    load(false);
  }, [load]);

  const reset = useCallback(() => {
    clearRetryTimer();
    setError(null);
    setIsLoading(false);
    isLoadingRef.current = false;
    retryCountRef.current = 0;
  }, []);

  return useMemo(
    () => ({ sentinelRef, isLoading, error, retry, reset }),
    [isLoading, error, retry, reset],
  );
}
