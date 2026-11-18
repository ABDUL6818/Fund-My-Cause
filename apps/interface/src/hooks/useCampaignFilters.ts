import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { normalizeDateInput } from "@/lib/date";

function toFiniteNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateParam(value: string | null): string {
  return normalizeDateInput(value) ?? "";
}

export type FilterTab = "all" | "active" | "funded" | "ended";
export type SortOption = "recent" | "popular" | "deadline" | "progress";

export interface CampaignFilters {
  filter: FilterTab;
  sort: SortOption;
  query: string;
  category: string;
  page: number;
  goalMin: string;
  goalMax: string;
  dateFrom: string;
  dateTo: string;
}

export interface UseCampaignFiltersReturn {
  filters: CampaignFilters;
  setParam: (key: string, value: string) => void;
  setInputValue: (value: string) => void;
  setGoalMin: (value: string) => void;
  setGoalMax: (value: string) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  applyAdvanced: () => void;
  clearAdvanced: () => void;
  inputValue: string;
  showAdvanced: boolean;
  setShowAdvanced: (value: boolean) => void;
  hasAdvanced: boolean;
  activeGoalMin: number | null;
  activeGoalMax: number | null;
  activeDateFrom: string | null;
  activeDateTo: string | null;
}

export function useCampaignFilters(): UseCampaignFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter = (searchParams.get("filter") as FilterTab) ?? "all";
  const sort = (searchParams.get("sort") as SortOption) ?? "recent";
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Math.max(1, toFiniteNumber(searchParams.get("page")) ?? 1);

  const [inputValue, setInputValue] = React.useState(query);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [goalMin, setGoalMin] = React.useState(
    searchParams.get("goalMin") ?? "",
  );
  const [goalMax, setGoalMax] = React.useState(
    searchParams.get("goalMax") ?? "",
  );
  const [dateFrom, setDateFrom] = React.useState(
    toDateParam(searchParams.get("dateFrom")),
  );
  const [dateTo, setDateTo] = React.useState(
    toDateParam(searchParams.get("dateTo")),
  );

  const setParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "") {
        params.delete(key);
      } else if (key === "filter" && value === "all") {
        params.delete(key);
      } else if (key === "sort" && value === "recent") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      if (key !== "page") params.delete("page");
      router.replace(`/campaigns?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const applyAdvanced = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (goalMin) params.set("goalMin", goalMin);
    else params.delete("goalMin");
    if (goalMax) params.set("goalMax", goalMax);
    else params.delete("goalMax");
    const normalizedFrom = normalizeDateInput(dateFrom);
    if (normalizedFrom) params.set("dateFrom", normalizedFrom);
    else params.delete("dateFrom");
    const normalizedTo = normalizeDateInput(dateTo);
    if (normalizedTo) params.set("dateTo", normalizedTo);
    else params.delete("dateTo");
    params.delete("page");
    router.replace(`/campaigns?${params.toString()}`, { scroll: false });
    setShowAdvanced(false);
  };

  const clearAdvanced = () => {
    setGoalMin("");
    setGoalMax("");
    setDateFrom("");
    setDateTo("");
    const params = new URLSearchParams(searchParams.toString());
    ["goalMin", "goalMax", "dateFrom", "dateTo"].forEach((k) =>
      params.delete(k),
    );
    params.delete("page");
    router.replace(`/campaigns?${params.toString()}`, { scroll: false });
  };

  React.useEffect(() => {
    setInputValue(query);
  }, [query]);

  React.useEffect(() => {
    const timer = setTimeout(() => setParam("q", inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue, setParam]);

  const activeGoalMin = toFiniteNumber(searchParams.get("goalMin"));
  const activeGoalMax = toFiniteNumber(searchParams.get("goalMax"));
  const activeDateFrom = normalizeDateInput(searchParams.get("dateFrom"));
  const activeDateTo = normalizeDateInput(searchParams.get("dateTo"));
  const hasAdvanced = !!(
    activeGoalMin ||
    activeGoalMax ||
    activeDateFrom ||
    activeDateTo
  );

  const filters: CampaignFilters = {
    filter,
    sort,
    query,
    category,
    page,
    goalMin,
    goalMax,
    dateFrom,
    dateTo,
  };

  return {
    filters,
    setParam,
    setInputValue,
    setGoalMin,
    setGoalMax,
    setDateFrom,
    setDateTo,
    applyAdvanced,
    clearAdvanced,
    inputValue,
    showAdvanced,
    setShowAdvanced,
    hasAdvanced,
    activeGoalMin,
    activeGoalMax,
    activeDateFrom,
    activeDateTo,
  };
}
