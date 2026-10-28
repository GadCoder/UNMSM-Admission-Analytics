import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { apiFetch } from "../../../shared/api/client";
import { resolveAdmissionModality } from "../utils/admissionModality";
import type {
  AcademicArea,
  AdmissionProcess,
  ComparativeOverview,
  Faculty,
  MajorCatalogItem,
  MajorDetail,
  Modality,
  ProcessHistory,
} from "./analytics.types";

export type AnalyticsFilters = { academicArea?: string; faculty?: string; modality?: string };

export function getPublishedProcesses(signal?: AbortSignal): Promise<AdmissionProcess[]> {
  return apiFetch<AdmissionProcess[]>("/api/v1/processes/", { signal });
}
export function getAcademicAreas(signal?: AbortSignal): Promise<AcademicArea[]> {
  return apiFetch<AcademicArea[]>("/api/v1/academic-areas/", { signal });
}
export function getFaculties(signal?: AbortSignal): Promise<Faculty[]> {
  return apiFetch<Faculty[]>("/api/v1/faculties/", { signal });
}
export function getModalities(signal?: AbortSignal): Promise<Modality[]> {
  return apiFetch<Modality[]>("/api/v1/modalities/", { signal });
}
export function getMajorCatalog(signal?: AbortSignal): Promise<MajorCatalogItem[]> {
  return apiFetch<MajorCatalogItem[]>("/api/v1/majors/", { signal });
}

export function getAnalyticsOverview(
  primary: string | number,
  comparisons: Array<string | number> = [],
  filters: AnalyticsFilters = {},
  signal?: AbortSignal,
): Promise<ComparativeOverview> {
  const params = new URLSearchParams({ process: String(primary) });
  if (comparisons.length) params.set("compare", comparisons.slice(0, 3).map(String).join(","));
  if (filters.academicArea) params.set("academic_area", filters.academicArea);
  if (filters.faculty) params.set("faculty", filters.faculty);
  if (filters.modality) params.set("modality", filters.modality);
  return apiFetch<ComparativeOverview>(`/api/v1/analytics/overview/?${params.toString()}`, {
    signal,
  });
}

export function getProcessHistory(
  filters: AnalyticsFilters = {},
  signal?: AbortSignal,
): Promise<ProcessHistory> {
  const params = new URLSearchParams();
  if (filters.academicArea) params.set("academic_area", filters.academicArea);
  if (filters.faculty) params.set("faculty", filters.faculty);
  if (filters.modality) params.set("modality", filters.modality);
  const query = params.toString();
  return apiFetch<ProcessHistory>(`/api/v1/analytics/history/${query ? `?${query}` : ""}`, {
    signal,
  });
}

export function useProcessHistory(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ["analytics-history", filters],
    queryFn: ({ signal }) => getProcessHistory(filters, signal),
    staleTime: 300000,
  });
}

export function usePublishedProcesses() {
  return useQuery({
    queryKey: ["published-processes"],
    queryFn: ({ signal }) => getPublishedProcesses(signal),
  });
}

export function getMajorDetail(
  majorId: string | number,
  primary: string | number,
  comparisons: Array<string | number> = [],
  modality?: string,
  signal?: AbortSignal,
): Promise<MajorDetail> {
  const params = new URLSearchParams({ process: String(primary) });
  if (comparisons.length) params.set("compare", comparisons.slice(0, 3).map(String).join(","));
  if (modality) params.set("modality", modality);
  return apiFetch<MajorDetail>(`/api/v1/analytics/majors/${majorId}/?${params.toString()}`, {
    signal,
  });
}

export function useMajorDetail(
  majorId: string,
  primary: string,
  comparisons: string[],
  modality?: string,
) {
  const processes = usePublishedProcesses().data ?? [];
  const resolvedModality = resolveAdmissionModality(modality);
  const query = useQuery({
    ...majorHistoryQueryOptions(majorId, resolvedModality, processes),
    queryFn: ({ signal }) => getMajorDetail(majorId, primary, [], resolvedModality, signal),
    enabled: Boolean(majorId && processes.some((process) => String(process.id) === primary)),
    select: (detail) => {
      const selectedIds = [...new Set([primary, ...comparisons])];
      const byProcess = new Map(
        [...detail.history, ...detail.selected_processes].map((row) => [
          String(row.process.id),
          row,
        ]),
      );
      return {
        ...detail,
        selected_processes: selectedIds.flatMap((id) => byProcess.get(id) ?? []),
        history: processes.flatMap((process) => {
          const id = String(process.id);
          return selectedIds.includes(id) ? [] : (byProcess.get(id) ?? []);
        }),
      };
    },
  });
  useRefreshHistoryOnProcessChange(primary, [query]);
  return query;
}

export function useRefreshHistoryOnProcessChange(
  primary: string,
  queries: UseQueryResult<MajorDetail>[],
) {
  const previous = useRef(primary);
  useEffect(() => {
    if (previous.current === primary) return;
    previous.current = primary;
    // Reuse fresh history, but preserve revalidation when changing periods
    // after the normal freshness window has elapsed.
    for (const query of queries) {
      if (query.isStale && !query.isFetching) void query.refetch();
    }
  }, [primary, queries]);
}

export function majorHistoryQueryOptions(
  majorId: string | number,
  modality: string | undefined,
  processes: AdmissionProcess[],
) {
  return {
    // The response includes all periods. Refresh when the published set changes,
    // rather than downloading the same history for each selected period.
    queryKey: [
      "major-history",
      String(majorId),
      resolveAdmissionModality(modality),
      processes.map((process) => process.id).sort((a, b) => a - b),
    ],
    staleTime: 60_000,
  };
}

export function useAcademicAreas(enabled = true) {
  return useQuery({
    queryKey: ["academic-areas"],
    queryFn: ({ signal }) => getAcademicAreas(signal),
    staleTime: 300000,
    enabled,
  });
}
export function useFaculties(enabled = true) {
  return useQuery({
    queryKey: ["faculties"],
    queryFn: ({ signal }) => getFaculties(signal),
    staleTime: 300000,
    enabled,
  });
}
export function useModalities() {
  return useQuery({
    queryKey: ["modalities"],
    queryFn: ({ signal }) => getModalities(signal),
    staleTime: 300000,
  });
}
export function useMajorCatalog() {
  return useQuery({
    queryKey: ["major-catalog"],
    queryFn: ({ signal }) => getMajorCatalog(signal),
    staleTime: 300000,
  });
}

export function useAnalyticsOverview(
  primary: string,
  comparisons: string[],
  filters: AnalyticsFilters = {},
) {
  return useQuery({
    queryKey: ["analytics-overview", primary, comparisons, filters],
    queryFn: ({ signal }) => getAnalyticsOverview(primary, comparisons, filters, signal),
    enabled: Boolean(primary),
    placeholderData: (previousData, previousQuery) =>
      JSON.stringify(previousQuery?.queryKey[3]) === JSON.stringify(filters) &&
      previousData?.processes.some((item) => String(item.process.id) === String(primary))
        ? previousData
        : undefined,
  });
}
