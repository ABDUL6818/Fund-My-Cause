import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { fetchCampaignView } from "@/lib/graphql/client";
import type { CampaignInfo, CampaignStats } from "@fund-my-cause/types";
import { isValidContractId } from "@/lib/validation";
import { QUERY_KEYS } from "@fund-my-cause/shared-utils";

export interface CampaignInitialData {
  info: CampaignInfo;
  stats: CampaignStats;
}

/**
 * useCampaign — fetches and caches campaign info + stats.
 *
 * @param contractId - The Soroban contract ID for this campaign
 * @param initialData - Optional SSR-preloaded data. When provided, React Query
 *   uses it as the initial cache value so the component renders with data
 *   on the first paint (no loading state), then re-fetches in the background
 *   for live updates. This is the key mechanism that makes ISR pages render
 *   meaningful HTML without JS while still refreshing automatically.
 */
export function useCampaign(
  contractId: string,
  initialData?: CampaignInitialData,
) {
  const queryClient = useQueryClient();
  const [optimisticDelta, setOptimisticDelta] = useState<{
    raisedDelta: bigint;
    countDelta: number;
  } | null>(null);

  const {
    data,
    isLoading: loading,
    error: rawError,
  } = useQuery<{ info: CampaignInfo; stats: CampaignStats }, Error>({
    queryKey: QUERY_KEYS.campaign(contractId),
    queryFn: () => fetchCampaignView(contractId),
    enabled: isValidContractId(contractId),
    retry: false,
    // SSR-preloaded data seeds the cache so the first render is instant and
    // the component never enters the loading skeleton state on page load.
    initialData: initialData ?? undefined,
    // Treat SSR data as fresh for the staleTime window (set via setQueryDefaults
    // in ReactQueryProvider) so the ISR page doesn't trigger an immediate refetch.
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });

  const error =
    rawError?.message ??
    (isValidContractId(contractId)
      ? null
      : `Invalid contract ID format: ${contractId}`);

  const refresh = useCallback(() => {
    setOptimisticDelta(null);
    return queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.campaign(contractId),
    });
  }, [queryClient, contractId]);

  /** Immediately apply an optimistic contribution (amountXlm in XLM) */
  const applyOptimisticContribution = useCallback((amountXlm: number) => {
    const stroops = BigInt(Math.round(amountXlm * 1e7));
    setOptimisticDelta({ raisedDelta: stroops, countDelta: 1 });
  }, []);

  /** Roll back the optimistic update */
  const rollbackOptimistic = useCallback(() => {
    setOptimisticDelta(null);
  }, []);

  const baseStats = data?.stats ?? null;
  const stats: CampaignStats | null =
    baseStats && optimisticDelta
      ? {
          ...baseStats,
          totalRaised: baseStats.totalRaised + optimisticDelta.raisedDelta,
          contributorCount:
            baseStats.contributorCount + optimisticDelta.countDelta,
        }
      : baseStats;

  return {
    info: data?.info ?? null,
    stats,
    loading,
    error,
    refresh,
    applyOptimisticContribution,
    rollbackOptimistic,
  };
}

type SignTx = (xdr: string) => Promise<string>;

/**
 * Shared factory for campaign mutations. All campaign mutations follow the
 * same shape: run a contract call, then invalidate the campaign query so the
 * cached info/stats are refreshed. Extracted here to dedupe the previously
 * copy-pasted mutation hooks.
 */
function useCampaignMutation<TVars>(
  contractId: string,
  mutationFn: (vars: TVars) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.campaign(contractId),
      }),
  });
}

export function useContribute(contractId: string) {
  return useCampaignMutation<{
    contributor: string;
    amount: bigint;
    signTx: SignTx;
  }>(contractId, async ({ contributor, amount, signTx }) => {
    const { contribute } = await import("@/lib/contract");
    return contribute(contractId, contributor, amount, signTx);
  });
}

export function useWithdraw(contractId: string) {
  return useCampaignMutation<{ creator: string; signTx: SignTx }>(
    contractId,
    async ({ creator, signTx }) => {
      const { withdraw } = await import("@/lib/contract");
      return withdraw(contractId, creator, signTx);
    },
  );
}

export function useRefund(contractId: string) {
  return useCampaignMutation<{ contributor: string; signTx: SignTx }>(
    contractId,
    async ({ contributor, signTx }) => {
      const { refundSingle } = await import("@/lib/contract");
      return refundSingle(contractId, contributor, signTx);
    },
  );
}

export function useBatchRefund(contractId: string) {
  return useCampaignMutation<{
    caller: string;
    contributors: string[];
    signTx: SignTx;
  }>(contractId, async ({ caller, contributors, signTx }) => {
    const { refundBatch } = await import("@/lib/contract");
    return refundBatch(contractId, caller, contributors, signTx);
  });
}

export function usePause(contractId: string) {
  return useCampaignMutation<{ admin: string; signTx: SignTx }>(
    contractId,
    async ({ admin, signTx }) => {
      const { pauseCampaign } = await import("@/lib/contract");
      return pauseCampaign(contractId, admin, signTx);
    },
  );
}

export function useUnpause(contractId: string) {
  return useCampaignMutation<{ admin: string; signTx: SignTx }>(
    contractId,
    async ({ admin, signTx }) => {
      const { unpauseCampaign } = await import("@/lib/contract");
      return unpauseCampaign(contractId, admin, signTx);
    },
  );
}
