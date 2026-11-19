import { useQuery } from "@tanstack/react-query";
import { getHorizonServer } from "@/lib/stellar";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Checks whether a Stellar account is funded (exists on the network).
 * @param {string|null} address - Stellar account address to check
 * @returns {{ exists: boolean, loading: boolean }}
 */
export function useAccountExists(address: string | null): { exists: boolean; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.accountExists(address ?? ""),
    queryFn: async () => {
      if (!address) return false;
      try {
        await getHorizonServer().accounts().accountId(address).call();
        return true;
      } catch {
        return false;
      }
    },
    enabled: !!address,
    staleTime: 30_000,
    retry: 1,
  });

  return { exists: !!address && !!data, loading: !!address && isLoading };
}