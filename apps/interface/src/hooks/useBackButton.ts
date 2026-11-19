"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { appendHistoryEntry } from "@repo/shared-utils";

export interface UseBackButtonOptions {
  /** Route to navigate to when no history is available */
  fallbackPath?: string;
  /** Show a confirmation dialog before navigating back */
  confirmMessage?: string;
  /** Max number of history entries to track */
  maxHistory?: number;
}

export interface UseBackButtonReturn {
  /** Navigate back — shows confirmation if configured */
  goBack: () => void;
  /** Whether there is at least one previous page in the tracked history */
  canGoBack: boolean;
  /** The list of visited paths tracked during this session */
  history: string[];
  /** Whether the confirmation dialog is currently showing */
  confirmOpen: boolean;
  /** Call this to confirm the navigation */
  confirmBack: () => void;
  /** Call this to cancel the navigation */
  cancelBack: () => void;
}

export function useBackButton({
  fallbackPath = "/",
  confirmMessage,
  maxHistory = 50,
}: UseBackButtonOptions = {}): UseBackButtonReturn {
  const router = useRouter();
  const pathname = usePathname();
  const historyRef = useRef<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Track pathname changes
  useEffect(() => {
    const next = appendHistoryEntry(historyRef.current, pathname, maxHistory);
    if (next === historyRef.current) return;
    historyRef.current = next;
    setHistory(next);
  }, [pathname, maxHistory]);

  const canGoBack = history.length > 1;

  const performBack = useCallback(() => {
    const prev = historyRef.current;
    if (prev.length > 1) {
      // Remove current entry
      historyRef.current = prev.slice(0, -1);
      setHistory(historyRef.current);
      router.back();
    } else {
      router.push(fallbackPath);
    }
  }, [router, fallbackPath]);

  const goBack = useCallback(() => {
    if (confirmMessage) {
      setConfirmOpen(true);
    } else {
      performBack();
    }
  }, [confirmMessage, performBack]);

  const confirmBack = useCallback(() => {
    setConfirmOpen(false);
    performBack();
  }, [performBack]);

  const cancelBack = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  return { goBack, canGoBack, history, confirmOpen, confirmBack, cancelBack };
}
