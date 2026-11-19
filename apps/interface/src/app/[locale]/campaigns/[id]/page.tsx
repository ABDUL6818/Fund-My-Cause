import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ShareTrigger } from "./ShareTrigger";
import { fetchCampaign } from "@/lib/graphql/client";
import { getStaticCampaignIds } from "@/lib/soroban";
import { ShareButton } from "@/components/ui/ShareButton";
import { TransactionHistory } from "@/components/ui/TransactionHistory";
import { APP_BASE_URL, DEFAULT_HERO_IMAGE } from "@/lib/constants";
import { getCampaignDetailData } from "@/lib/campaignDetail";
import { CampaignDetailHero } from "@/components/campaign/CampaignDetailHero";
import { CampaignDetailHeader } from "@/components/campaign/CampaignDetailHeader";
import { CampaignDetailProgress } from "@/components/campaign/CampaignDetailProgress";
import { CampaignDetailStats } from "@/components/campaign/CampaignDetailStats";
import { CampaignDetailSocialLinks } from "@/components/campaign/CampaignDetailSocialLinks";
import { CampaignActions } from "./CampaignActions";
import { CampaignDetailContent } from "./CampaignDetailContent";
import { CampaignProvider } from "@/contexts/CampaignContext";

// ── Static Generation (SSG + ISR) ─────────────────────────────────────────────

/**
 * Generate static pages for all known campaigns at build time.
 * Falls back to dynamic rendering for unknown contract IDs.
 */
export async function generateStaticParams() {
  const campaignIds = getStaticCampaignIds();
  return campaignIds.map((id) => ({
    id,
  }));
}

// ── ISR Configuration ─────────────────────────────────────────────────────────

export const revalidate = 60;

// ── SEO ───────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const c = await fetchCampaign(id);
    const description = c.description.slice(0, 160);
    const url = `${APP_BASE_URL}/campaigns/${id}`;
    return {
      title: `${c.title} — Fund-My-Cause`,
      description,
      openGraph: {
        title: c.title,
        description,
        url,
        siteName: "Fund-My-Cause",
        images: [
          { url: DEFAULT_HERO_IMAGE, width: 1200, height: 630, alt: c.title },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: c.title,
        description,
        images: [DEFAULT_HERO_IMAGE],
      },
    };
  } catch {
    return { title: "Campaign — Fund-My-Cause" };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getCampaignDetailData(id);
  } catch {
    notFound();
  }

  return (
    <CampaignProvider campaignId={id} initialData={data}>
      <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
        <Navbar />

        <CampaignDetailHero />

        <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
          <CampaignDetailHeader />

          <CampaignDetailProgress />

          <CampaignDetailStats />

          <CampaignDetailSocialLinks />

          <ShareTrigger />
          <TransactionHistory />
          <ShareButton />

          <CampaignActions />
        </div>
        <CampaignDetailContent />
      </main>
    </CampaignProvider>
  );
}
