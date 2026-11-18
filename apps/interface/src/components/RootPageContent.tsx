"use client";

import React from "react";
import { ErrorBoundary } from "@fund-my-cause/components";
import { DevErrorSimulator } from "@/components/DevErrorSimulator";
import { WalletProvider } from "@/context/WalletContext";

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