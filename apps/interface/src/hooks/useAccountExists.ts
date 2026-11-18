import { useState, useEffect } from "react";
import { HORIZON_URL } from "@/lib/constants";
import { fetchWithRetry } from "@stellar/shared-utils";

/**
 * Checks whether a Stellar account is funded (exists on the network).
 * @param {string|null} address - Stellar account address to check
 * @returns {{ exists: boolean, loading: boolean }}
 */
export function useAccountExists(address: string | null): { exists: boolean; loading: boolean } {
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setExists(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchWithRetry(`${HORIZON_URL}/accounts/${address}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!controller.signal.aborted) setExists(res.ok);
      })
      .catch(() => {
        if (!controller.signal.aborted) setExists(false);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [address]);

  return { exists, loading };
}