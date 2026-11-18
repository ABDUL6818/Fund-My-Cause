"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchContribution, fetchAllCampaigns } from "@/lib/graphql/client";
import { queryKeys } from "@/lib/query/keys";

export interface ContributionEntry {
  contractId: string;
  campaignTitle: string;
  amount: number; // XLM
  date: number; // Unix ms timestamp (approximate — uses current time when not available)
}

interface UseContributionsResult {
  contributions: ContributionEntry[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Fetches all contributions made by the given address across all known campaigns.
 * Sorts results by date descending (most recent first).
 */
async function loadContributions(address: string): Promise<ContributionEntry[]> {
  const campaigns = await fetchAllCampaigns();
  const results = await Promise.allSettled(
    campaigns.map(async (campaign) => {
      const amount = await fetchContribution(campaign.contractId, address);
      return { campaign, amount };
    }),
  );

  const entries: ContributionEntry[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.amount > 0) {
      const { campaign, amount } = result.value;
      entries.push({
        contractId: campaign.contractId,
        campaignTitle: campaign.title,
        amount,
        // Use campaign deadline as a proxy date when no tx timestamp available
        date: new Date(campaign.deadline).getTime(),
      });
    }
  }

  // Sort by date descending
  entries.sort((a, b) => b.date - a.date);
  return entries;
}

export function useContributions(address: string): UseContributionsResult {
  const query = useQuery({
    queryKey: queryKeys.contributions.byAddress(address),
    queryFn: () => loadContributions(address),
    enabled: Boolean(address),
  });

  const retry = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    contributions: address ? (query.data ?? []) : [],
    loading: Boolean(address) && query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load contributions."
      : null,
    retry,
  };
}
