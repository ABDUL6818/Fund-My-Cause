"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@fund-my-cause/components";
import { DevErrorSimulator } from "@/components/DevErrorSimulator";
import { WalletProvider } from "@/context/WalletContext";

const CampaignCreate = dynamic(
  () =>
    import("@/app/campaigns/create/page").then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div role="status" aria-live="polite" data-testid="campaign-create-loading">
        Loading campaign create…
      </div>
    ),
  },
);

const Dashboard = dynamic(
  () =>
    import("@/app/dashboard/page").then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div role="status" aria-live="polite" data-testid="dashboard-loading">
        Loading dashboard…
      </div>
    ),
  },
);

interface RootPageContentProps {
  children: React.ReactNode;
}

export function RootPageContent({ children }: RootPageContentProps) {
  return (
    <ErrorBoundary level="page">
      <WalletProvider>
        <DevErrorSimulator />
        {children}
      </WalletProvider>
    </ErrorBoundary>
  );
}

export { CampaignCreate, Dashboard };
export default RootPageContent;
