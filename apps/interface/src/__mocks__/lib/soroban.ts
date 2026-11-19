export const getRpcServer = jest.fn(() => ({
  getAccount: jest.fn(),
  getLatestLedger: jest.fn(),
  simulateTransaction: jest.fn(),
  prepareTransaction: jest.fn(),
  sendTransaction: jest.fn(),
  getTransaction: jest.fn(),
}));

export const getHorizonServer = jest.fn(() => ({
  loadAccount: jest.fn(),
  fetchBaseFee: jest.fn(),
  submitTransaction: jest.fn(),
}));

export const getStaticCampaignIds = jest.fn(() => []);
export const buildInitializeTx = jest.fn();
export const buildWithdrawTx = jest.fn();
export const buildCancelTx = jest.fn();
export const buildPauseTx = jest.fn();
export const buildUnpauseTx = jest.fn();
export const buildRefundTx = jest.fn();
export const buildUpdateMetadataTx = jest.fn();
export const buildContributeTx = jest.fn();
export const simulateTx = jest.fn();
export const submitSignedTx = jest.fn();