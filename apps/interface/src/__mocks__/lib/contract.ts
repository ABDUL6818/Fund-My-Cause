export const getCampaignInfo = jest.fn();
export const getCampaignStats = jest.fn();
export const contribute = jest.fn();
export const withdraw = jest.fn();
export const refundSingle = jest.fn();
export const getContractClient = jest.fn();

export enum ErrorCode {
  Unknown = 0,
  Unauthorized = 1,
  InvalidAmount = 2,
  CampaignNotFound = 3,
  CampaignEnded = 4,
  CampaignNotActive = 5,
  GoalNotReached = 6,
  GoalReached = 7,
  AlreadyWithdrawn = 8,
  AlreadyRefunded = 9,
  InsufficientFunds = 10,
  DeadlineNotReached = 11,
  NotContributor = 12,
  ContractPaused = 13,
  InvalidState = 14,
}

export class ContractError extends Error {
  code: ErrorCode;

  constructor(message?: string, code: ErrorCode = ErrorCode.Unknown) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
  }
}

export const getContractErrorMessage = jest.fn(
  (code: ErrorCode, fallback?: string): string => fallback ?? String(code),
);

export const getContractErrorMessages = jest.fn(
  (): Record<ErrorCode, string> => ({}) as Record<ErrorCode, string>,
);

export const mapContractError = jest.fn(
  (error: unknown, fallback?: string): string => {
    if (error instanceof ContractError) {
      return getContractErrorMessage(error.code, fallback);
    }
    return fallback ?? '';
  },
);