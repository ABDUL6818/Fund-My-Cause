"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  useDebounce,
  readPersisted,
  writePersisted,
  clearPersisted,
  hasPersisted,
} from "@fmc/shared-utils";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutoSaveOptions<T> {
  /** Debounce delay in ms before triggering a save (default: 1000). */
  debounceMs?: number;
  /** localStorage key to persist data under. */
  storageKey: string;
  /** Whether auto-save is enabled. */
  enabled?: boolean;
  /** Called after every successful save. */
  onSave?: (data: T) => void;
  /** Called on save error. */
  onError?: (err: unknown) => void;
}

export interface UseAutoSaveReturn<T> {
  /** Current save status. */
  status: AutoSaveStatus;
  /** Timestamp of the last successful save, or null. */
  lastSaved: Date | null;
  /** Whether saved data exists in localStorage. */
  hasRecovery: boolean;
  /** Load and return the last saved data, or null if none. */
  recover: () => T | null;
  /** Delete the saved data from localStorage. */
  clearRecovery: () => void;
  /** Trigger a save immediately (bypasses debounce). */
  saveNow: () => void;
}

/**
 * Automatically saves `data` to localStorage after the debounce delay.
 * Provides recovery detection and manual save trigger.
 *
 * @example
 * const { status, hasRecovery, recover, clearRecovery } = useAutoSave(formData, {
 *   storageKey: "fmc:form_draft",
 *   debounceMs: 800,
 * });
 */
export function useAutoSave<T>(
  data: T,
  {
    debounceMs = 1000,
    storageKey,
    enabled = true,
    onSave,
    onError,
  }: UseAutoSaveOptions<T>,
): UseAutoSaveReturn<T> {
  const debouncedData = useDebounce(data, debounceMs);
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasRecovery, setHasRecovery] = useState(false);
  const isFirstRender = useRef(true);
  const dataRef = useRef(data);

  // Keep ref fresh for the imperative saveNow path.
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Detect existing recovery on mount.
  useEffect(() => {
    setHasRecovery(hasPersisted(storageKey));
  }, [storageKey]);

  const persist = useCallback(
    (payload: T) => {
      setStatus("saving");
      try {
        writePersisted(storageKey, payload);
        setLastSaved(new Date());
        setHasRecovery(true);
        setStatus("saved");
        onSave?.(payload);
      } catch (err) {
        setStatus("error");
        onError?.(err);
      }
    },
    [storageKey, onSave, onError],
  );

  // Reset "saved" back to "idle" after 3 s.
  useEffect(() => {
    if (status === "saved") {
      const id = setTimeout(() => setStatus("idle"), 3000);
      return () => clearTimeout(id);
    }
  }, [status]);

  // Auto-save whenever debounced data changes (skip the initial mount).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!enabled) return;
    persist(debouncedData);
  }, [debouncedData, enabled, persist]);

  const recover = useCallback((): T | null => {
    return readPersisted<T>(storageKey);
  }, [storageKey]);

  const clearRecovery = useCallback(() => {
    clearPersisted(storageKey);
    setHasRecovery(false);
  }, [storageKey]);

  const saveNow = useCallback(() => {
    persist(dataRef.current);
  }, [persist]);

  return { status, lastSaved, hasRecovery, recover, clearRecovery, saveNow };
}
