import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../shared/api/client";
import type { AdmissionProcess, ComparativeOverview } from "./analytics.types";

export function getPublishedProcesses(): Promise<AdmissionProcess[]> {
  return apiFetch<AdmissionProcess[]>("/api/v1/processes/");
}

export function getAnalyticsOverview(primary: string | number, comparisons: Array<string | number> = []): Promise<ComparativeOverview> {
  const params = new URLSearchParams({ process: String(primary) });
  if (comparisons.length) params.set("compare", comparisons.slice(0, 3).map(String).join(","));
  return apiFetch<ComparativeOverview>(`/api/v1/analytics/overview/?${params.toString()}`);
}

export function usePublishedProcesses() {
  return useQuery({ queryKey: ["published-processes"], queryFn: getPublishedProcesses });
}

export function useAnalyticsOverview(primary: string, comparisons: string[]) {
  return useQuery({
    queryKey: ["analytics-overview", primary, comparisons],
    queryFn: () => getAnalyticsOverview(primary, comparisons),
    enabled: Boolean(primary),
  });
}
