"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import { useToast } from "@/components/ui/Toast";
import { useWallet } from "@/hooks/useWallet";
import type { WalletType } from "@/services/wallet.service";

// Mounted once near the app root but only ever shown after the user opts
// in to connecting a wallet — load it on demand instead of shipping it in
// every route's initial bundle.
const WalletSelectModal = dynamic(
  () =>
    import("@/components/ui/WalletSelectModal").then(
      (mod) => mod.WalletSelectModal,
    ),
  { ssr: false },
);

/**
 * Renders the wallet picker whenever useWallet()'s connect() is called.
 * Lives outside the WalletContext's old Provider tree since Zustand stores
 * don't need one — mount this once near the app root.
 */
export function WalletSelectModalHost() {
  const { showWalletSelect, setShowWalletSelect, connectWith } = useWallet();
  const { addToast } = useToast();

  const handleSelect = useCallback(
    (walletType: WalletType) =>
      connectWith(walletType, (msg, type) => addToast(msg, type)),
    [connectWith, addToast],
  );

  if (!showWalletSelect) return null;

  return (
    <WalletSelectModal
      onSelect={handleSelect}
      onClose={() => setShowWalletSelect(false)}
    />
  );
}