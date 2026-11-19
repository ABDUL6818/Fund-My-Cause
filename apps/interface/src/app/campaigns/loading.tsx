/**
 * Loading skeleton for campaigns route segment — Issue #1285
 *
 * Displays while campaigns are being fetched.
 * Uses the shared CampaignListSkeleton so list loading states stay
 * consistent across the app (Issue #1669).
 */

import { CampaignListSkeleton } from "@fund-my-cause/components";

export default function CampaignsLoading() {
  return <CampaignListSkeleton count={6} />;
}
