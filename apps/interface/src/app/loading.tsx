import { CampaignListSkeleton } from "@fund-my-cause/components";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col gap-6 p-8 max-w-4xl mx-auto">
      <CampaignListSkeleton count={6} />
    </div>
  );
}