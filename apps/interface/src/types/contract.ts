/**
 * Contract interaction types
 */

/** Wallet signing function type */
export type SignFn = (xdr: string) => Promise<string>;

/**
 * Known contract error codes.
 *
 * These codes are mapped to user-facing messages via the
 * i18n-ready dictionary in `lib/contractErrors.ts`.
 */
export type ErrorCode =
  | "WALLET_NOT_CONNECTED"
  | "USER_REJECTED"
  | "INSUFFICIENT_BALANCE"
  | "INSUFFICIENT_ALLOWANCE"
  | "UNAUTHORIZED"
  | "CONTRACT_PAUSED"
  | "INVALID_ARGUMENT"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "DEADLINE_EXCEEDED"
  | "NETWORK_ERROR"
  | "SIMULATION_FAILED"
  | "UNKNOWN";

/**
 * Error thrown when a contract call fails.
 *
 * The constructor keeps the original `message`-only signature for backward
 * compatibility, while optionally accepting an `ErrorCode` and extra
 * `details` so the error mapper can standardize user-facing messages.
 */
export class ContractError extends Error {
  /** Optional machine-readable error code. */
  readonly code?: ErrorCode;

  /** Optional additional context (e.g. raw contract error payload). */
  readonly details?: unknown;

  constructor(message: string, code?: ErrorCode, details?: unknown) {
    super(message);
    this.name = "ContractError";
    this.code = code;
    this.details = details;
  }
}