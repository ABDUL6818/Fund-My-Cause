"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { z } from "zod";
import type { campaignFormSchema } from "@/lib/validation/campaign";

const DRAFT_KEY = "fmc:campaign_draft";
const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds
const SAVED_STATUS_RESET_MS = 3_000; // 3 seconds

/**
 * Draft payload derived from the shared campaign form schema so the draft
 * stays in sync with the react-hook-form based creation flow.
 */
export type CampaignDraftData = z.infer<typeof campaignFormSchema>;

export enum DraftSaveStatus {
  Idle = "idle",
  Saving = "saving",
  Saved = "saved",
  Error = "error",
  Conflict = "conflict",
}

interface UseCampaignDraftReturn {
  /** Whether a saved draft exists in localStorage */
  hasDraft: boolean;
  /** Load the saved draft data (returns null if none) */
  loadDraft: () => CampaignDraftData | null;
  /** Manually save the current form data as a draft */
  saveDraft: (data: CampaignDraftData) => void;
  /** Clear the draft from localStorage (call after successful deploy) */
  clearDraft: () => void;
  /** Current save status for UI feedback */
  saveStatus: DraftSaveStatus;
  /** Timestamp of the last successful save */
  lastSaved: Date | null;
  /**
   * Resolve conflict by either keeping local or remote version.
   * Returns the remote draft for "keep-remote" (so the caller can load it into
   * the form), or `null` for "keep-local" / when no remote draft exists.
   */
  resolveConflict: (
    resolution: "keep-local" | "keep-remote",
  ) => CampaignDraftData | null;
  /**
   * Hydrate the form with a draft. Returns the draft values to pass to
   * react-hook-form's `reset`, or `null` when no draft is available.
   */
  hydrateForm: () => CampaignDraftData | null;
  /** Reset the draft state (form + persisted draft) after a successful deploy */
  resetForm: () => void;
}

/**
 * Manages campaign draft persistence in localStorage.
 * Provides auto-save every 30 seconds and manual save capability.
 */
export function useCampaignDraft(
  currentData: CampaignDraftData,
): UseCampaignDraftReturn {
  const [hasDraft, setHasDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>(
    DraftSaveStatus.Idle,
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentDataRef = useRef(currentData);
  const isSavingRef = useRef(false);

  // Keep ref in sync so the interval always has the latest data
  useEffect(() => {
    currentDataRef.current = currentData;
  }, [currentData]);

  // Check for existing draft on mount and listen for external changes
  useEffect(() => {
    const checkDraft = () => {
      setHasDraft(readJsonStorage<CampaignDraftData>(DRAFT_KEY) !== null);
    };

    checkDraft();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === DRAFT_KEY && e.newValue !== e.oldValue) {
        // If we are currently saving, ignore the event we likely triggered
        if (isSavingRef.current) return;

        // If another tab saved, we have a potential conflict
        setSaveStatus(DraftSaveStatus.Conflict);
        setHasDraft(true);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveDraft = useCallback(
    (data: CampaignDraftData) => {
      if (saveStatus === DraftSaveStatus.Conflict) return;

      setSaveStatus(DraftSaveStatus.Saving);
      isSavingRef.current = true;
      try {
        writeJsonStorage(DRAFT_KEY, data);
        setHasDraft(true);
        setLastSaved(new Date());
        setSaveStatus(DraftSaveStatus.Saved);
      } catch {
        setSaveStatus(DraftSaveStatus.Error);
      } finally {
        isSavingRef.current = false;
      }
    },
    [saveStatus],
  );

  const loadDraft = useCallback((): CampaignDraftData | null => {
    return readJsonStorage<CampaignDraftData>(DRAFT_KEY);
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      setLastSaved(null);
      setSaveStatus(DraftSaveStatus.Idle);
    } catch {
      // non-critical
    }
  }, []);

  const hydrateForm = useCallback((): CampaignDraftData | null => {
    const draft = loadDraft();
    if (draft) {
      setHasDraft(true);
    }
    return draft;
  }, [loadDraft]);

  const resetForm = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  const resolveConflict = useCallback(
    (resolution: "keep-local" | "keep-remote"): CampaignDraftData | null => {
      if (resolution === "keep-local") {
        saveDraft(currentDataRef.current);
        return null;
      } else {
        // "keep-remote" - load the remote draft data
        const remoteDraft = loadDraft();
        setSaveStatus(DraftSaveStatus.Idle);
        return remoteDraft;
      }
    },
    [saveDraft, loadDraft],
  );

  // Auto-save every 30 seconds — only when the form has meaningful content
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (saveStatus === DraftSaveStatus.Conflict) return;

      const data = currentDataRef.current;
      const hasContent =
        data.title.trim() ||
        data.description.trim() ||
        data.goal.trim() ||
        data.contractId.trim();

      if (hasContent) {
        saveDraft(data);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveDraft, saveStatus]);

  // Reset "saved" status back to "idle" after 3 seconds
  useEffect(() => {
    if (saveStatus === DraftSaveStatus.Saved) {
      const timer = setTimeout(
        () => setSaveStatus(DraftSaveStatus.Idle),
        SAVED_STATUS_RESET_MS,
      );
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  return {
    hasDraft,
    loadDraft,
    saveDraft,
    clearDraft,
    saveStatus,
    lastSaved,
    resolveConflict,
    hydrateForm,
    resetForm,
  };
}
