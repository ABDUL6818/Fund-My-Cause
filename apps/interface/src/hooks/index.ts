// Custom hooks library
// Shared hooks now live in the shared package and are re-exported here to
// keep the public hook surface stable for existing imports.
export { useLocalStorage } from "@shared/hooks";
export { useDebounce } from "@shared/hooks";
export { useAsync } from "@shared/hooks";
export type { AsyncStatus, AsyncState, UseAsyncReturn } from "@shared/hooks";
export { useInfiniteList } from "@shared/hooks";
export type {
  UseInfiniteListOptions,
  UseInfiniteListReturn,
  InfiniteListPage,
} from "@shared/hooks";

// Wallet hook — single source of wallet state for all components
export { useWallet } from "./useWallet";

// Domain hooks
export {
  useCampaign,
  useContribute,
  useWithdraw,
  useRefund,
  useBatchRefund,
  usePause,
  useUnpause,
} from "./useCampaign";
export { useCampaignDraft } from "./useCampaignDraft";
export type { CampaignDraftData, DraftSaveStatus } from "./useCampaignDraft";
export { useXlmBalance } from "./useXlmBalance";
export { useAccountExists } from "./useAccountExists";
export {
  useSimilarCampaigns,
  useRecommendedCampaigns,
} from "./useRecommendations";
export { useComments } from "./useComments";
export { useBreakpoint } from "@shared/hooks";
export { useFocusTrap } from "@shared/hooks";
export { useSearchSuggestions } from "./useSearchSuggestions";
export type { SearchSuggestion } from "./useSearchSuggestions";
export { useBackButton } from "@shared/hooks";
export type {
  UseBackButtonOptions,
  UseBackButtonReturn,
} from "@shared/hooks";

// PWA hooks
export { useInstallPrompt } from "@shared/hooks";

// Store slice hooks (scoped selectors — prefer these over direct store imports)
export {
  useCampaignSlice,
  usePledgeModal,
  useOptimisticDelta,
} from "./useCampaignSlice";
export {
  useWalletSlice,
  useWalletStatus,
  useWalletSigning,
} from "./useWalletSlice";
export {
  useUiSlice,
  useNotifSlice,
  useModalSlice,
  useThemeSlice,
} from "./useUiSlice";
