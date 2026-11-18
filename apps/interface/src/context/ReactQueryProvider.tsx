"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CACHE_TTLS } from "@/lib/cacheTTLs";
import { logger } from "@/lib/logger";

const rqLogger = logger.child("react-query");

const makeClient = () => {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        // Fallback for any query not covered by setQueryDefaults below
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        // Retry transient failures with exponential backoff (1s, 2s, 4s),
        // capped at 3 attempts.  Never retry 4xx client errors.
        retry: (failureCount, error) => {
          const status = (error as { status?: number } | null)?.status;
          if (typeof status === "number" && status >= 400 && status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 30_000),
        // Refetch policies: refresh stale data on focus/reconnect, but avoid
        // noisy background polling by default.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        refetchInterval: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Per-type stale-while-revalidate windows.  Each entry covers all query keys
  // that start with the given prefix — individual hooks must not repeat these.
  qc.setQueryDefaults(["campaign"], CACHE_TTLS.campaign);
  qc.setQueryDefaults(["campaign-info"], CACHE_TTLS.campaignInfo);
  qc.setQueryDefaults(["comments"], CACHE_TTLS.comments);
  qc.setQueryDefaults(["leaderboard"], CACHE_TTLS.leaderboard);
  qc.setQueryDefaults(["achievements"], CACHE_TTLS.achievements);
  qc.setQueryDefaults(["achievement-progress"], CACHE_TTLS.achievementProgress);
  qc.setQueryDefaults(["gamification-profile"], CACHE_TTLS.gamificationProfile);

  // Per-key defaults override the global fallback above; re-apply the retry
  // policy so the typed windows don't silently drop backoff behaviour.
  const retryPolicy = qc.getDefaultOptions().queries?.retry;
  const retryDelayPolicy = qc.getDefaultOptions().queries?.retryDelay;
  if (retryPolicy !== undefined) {
    qc.setQueryDefaults(["campaign"], { ...CACHE_TTLS.campaign, retry: retryPolicy, retryDelay: retryDelayPolicy });
    qc.setQueryDefaults(["campaign-info"], { ...CACHE_TTLS.campaignInfo, retry: retryPolicy, retryDelay: retryDelayPolicy });
    qc.setQueryDefaults(["comments"], { ...CACHE_TTLS.comments, retry: retryPolicy, retryDelay: retryDelayPolicy });
    qc.setQueryDefaults(["leaderboard"], { ...CACHE_TTLS.leaderboard, retry: retryPolicy, retryDelay: retryDelayPolicy });
    qc.setQueryDefaults(["achievements"], { ...CACHE_TTLS.achievements, retry: retryPolicy, retryDelay: retryDelayPolicy });
    qc.setQueryDefaults(["achievement-progress"], { ...CACHE_TTLS.achievementProgress, retry: retryPolicy, retryDelay: retryDelayPolicy });
    qc.setQueryDefaults(["gamification-profile"], { ...CACHE_TTLS.gamificationProfile, retry: retryPolicy, retryDelay: retryDelayPolicy });
  }

  // Log network fetches so request reduction can be observed while developing.
  // Each entry is a real RPC/API call; absence = cache hit.  `logger.debug` is
  // a no-op in production, so this never reaches a user's console.
  if (process.env.NODE_ENV !== "production") {
    let fetchCount = 0;
    qc.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "fetch") {
        fetchCount += 1;
        rqLogger.debug("fetch", {
          count: fetchCount,
          queryKey: event.query.queryKey,
        });
      }
    });
  }

  return qc;
};

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(makeClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Exported for tests so the shared client configuration can be asserted
// without mounting the provider.
export { makeClient as __makeQueryClientForTests };
