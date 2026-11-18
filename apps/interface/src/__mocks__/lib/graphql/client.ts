export const fetchCampaign = jest.fn();
export const fetchCampaignView = jest.fn();
export const fetchAllCampaigns = jest.fn();
export const fetchContribution = jest.fn();
export const fetchContributorList = jest.fn();
export const fetchTransactionHistory = jest.fn();
export const fetchCampaignDetail = jest.fn();
export const fetchApiStatus = jest.fn();
export const getGraphqlSdk = jest.fn();

// Typed data-fetching layer (React Query) query functions.
// These mirror the query functions exposed by the GraphQL client so that
// tests can exercise caching/retry behavior through the React Query hooks.
export const queryCampaign = jest.fn();
export const queryCampaignView = jest.fn();
export const queryAllCampaigns = jest.fn();
export const queryContribution = jest.fn();
export const queryContributorList = jest.fn();
export const queryTransactionHistory = jest.fn();
export const queryCampaignDetail = jest.fn();
export const queryApiStatus = jest.fn();

// Query key factory used by the React Query hooks for cache scoping.
export const queryKeys = {
  campaign: jest.fn((id?: string) => ['campaign', id] as const),
  campaignView: jest.fn((id?: string) => ['campaignView', id] as const),
  allCampaigns: jest.fn(() => ['allCampaigns'] as const),
  contribution: jest.fn((id?: string) => ['contribution', id] as const),
  contributorList: jest.fn((id?: string) => ['contributorList', id] as const),
  transactionHistory: jest.fn((id?: string) => ['transactionHistory', id] as const),
  campaignDetail: jest.fn((id?: string) => ['campaignDetail', id] as const),
  apiStatus: jest.fn(() => ['apiStatus'] as const),
};

// Default caching/retry configuration exposed by the client for tests.
export const defaultQueryOptions = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  retry: 3,
  retryDelay: expect.any(Function),
};