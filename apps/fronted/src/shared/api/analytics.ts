import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "./client";

export type AdmissionProcess = {
  id: number;
  year: number;
  sequence: number;
  name: string;
};

export type MajorOverview = {
  major_id: number;
  major_code: string;
  major_name: string;
  total_results: number;
  admitted_count: number;
  absent_count: number;
  average_score: string | null;
};

export type ProcessOverview = {
  process: AdmissionProcess;
  total_results: number;
  admitted_count: number;
  absent_count: number;
  average_score: string | null;
  highest_score: string | null;
  majors: MajorOverview[];
};

export type ComparativeOverview = { processes: ProcessOverview[] };

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
