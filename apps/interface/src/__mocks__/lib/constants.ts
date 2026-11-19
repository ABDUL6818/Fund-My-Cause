export const CONTRACT_ID = "CTEST_CONTRACT_ID";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_NAME = "testnet";
export const DEFAULT_CAMPAIGN_IMAGE = "https://example.com/image.jpg";
export const DEFAULT_CAMPAIGN_IMAGE_ALT_1 = "https://example.com/image1.jpg";
export const DEFAULT_CAMPAIGN_IMAGE_ALT_2 = "https://example.com/image2.jpg";
export const DEFAULT_CAMPAIGN_IMAGE_ALT_3 = "https://example.com/image3.jpg";
export const REGISTRY_CONTRACT_ID = "CTEST_REGISTRY_ID";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const PINATA_API_KEY = "";
export const PINATA_SECRET_API_KEY = "";
export const FEATURED_CAMPAIGNS: string[] = [];

export enum Network {
  TESTNET = "testnet",
  MAINNET = "mainnet",
  FUTURENET = "futurenet",
  STANDALONE = "standalone",
}

export const NETWORKS: Record<Network, { rpcUrl: string; horizonUrl: string; passphrase: string }> = {
  [Network.TESTNET]: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
    passphrase: "Test SDF Network ; September 2015",
  },
  [Network.MAINNET]: {
    rpcUrl: "https://soroban-mainnet.stellar.org",
    horizonUrl: "https://horizon.stellar.org",
    passphrase: "Public Global Stellar Network ; September 2015",
  },
  [Network.FUTURENET]: {
    rpcUrl: "https://rpc-futurenet.stellar.org",
    horizonUrl: "https://horizon-futurenet.stellar.org",
    passphrase: "Test SDF Future Network ; October 2022",
  },
  [Network.STANDALONE]: {
    rpcUrl: "http://localhost:8000/soroban/rpc",
    horizonUrl: "http://localhost:8000",
    passphrase: "Standalone Network ; February 2017",
  },
};

export enum CampaignStatus {
  ACTIVE = "active",
  SUCCESSFUL = "successful",
  FAILED = "failed",
  WITHDRAWN = "withdrawn",
  PENDING = "pending",
}

export enum ContributionStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export const Routes = {
  HOME: "/",
  CAMPAIGNS: "/campaigns",
  CAMPAIGN_DETAIL: (id: string) => `/campaigns/${id}`,
  CREATE_CAMPAIGN: "/campaigns/create",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ABOUT: "/about",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

export type Route = (typeof Routes)[keyof typeof Routes];