import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCampaignDetailData,
  type CampaignDetailViewData,
} from "@/lib/campaignDetail";
import { campaignQueryKeys } from "@packages/shared-utils";

export interface UseCampaignDetailOptions {
  initialData?: CampaignDetailViewData;
  enabled?: boolean;
}

export function useCampaignDetail(
  campaignId: string,
  options?: UseCampaignDetailOptions,
) {
  const query = useQuery<CampaignDetailViewData, Error>({
    queryKey: ["campaign-detail", campaignId],
    queryFn: () => getCampaignDetailData(campaignId),
    enabled: options?.enabled ?? Boolean(campaignId),
    initialData: options?.initialData,
  });

  return useMemo(
    () => ({
      data: query.data,
      error: query.error,
      isLoading: query.isLoading,
      isError: query.isError,
      isSuccess: query.isSuccess,
      isFetching: query.isFetching,
      status: query.status,
      refetch: query.refetch,
    }),
    [
      query.data,
      query.error,
      query.isLoading,
      query.isError,
      query.isSuccess,
      query.isFetching,
      query.status,
      query.refetch,
    ],
  );
}