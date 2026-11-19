// The generic async hook implementation now lives in the shared package
// (`packages/shared-utils/src/hooks/useAsync`) so it can be reused across apps.
// This file is kept as a thin re-export to preserve the existing public API
// and avoid breaking imports within `apps/interface`.
export {
  useAsync,
  type AsyncStatus,
  type AsyncState,
  type UseAsyncReturn,
} from "@repo/shared-utils/hooks/useAsync";
