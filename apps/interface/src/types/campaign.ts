export type { Campaign, FAQ, TeamMember, TrustSignalData } from "@fund-my-cause/types";

import type { Campaign } from "@fund-my-cause/types";

/**
 * Optional image presentation hints used by `next/image` rendering of campaign
 * cards and lists. These are additive and do not change the public `Campaign`
 * shape from `@fund-my-cause/types`.
 */
export interface CampaignImageHints {
  /** Source URL for the campaign image. */
  imageUrl?: string;
  /** Accessible alt text for the campaign image. */
  imageAlt?: string;
  /** `sizes` attribute hint for responsive `next/image` rendering. */
  sizes?: string;
  /** Blur placeholder data URL for `next/image` placeholders. */
  placeholder?: string;
}

/**
 * Campaign augmented with optional image hints for optimized rendering.
 * Falls back to the base `Campaign` type when hints are absent.
 */
export type CampaignWithImageHints = Campaign & CampaignImageHints;
</｜｜DSML｜｜ parameter>