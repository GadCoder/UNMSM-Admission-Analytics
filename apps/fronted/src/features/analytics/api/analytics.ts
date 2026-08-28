import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../shared/api/client";
import type { AcademicArea, AdmissionProcess, ComparativeOverview, Faculty, Modality } from "./analytics.types";

export type AnalyticsFilters = { academicArea?: string; faculty?: string; modality?: string };

export function getPublishedProcesses(): Promise<AdmissionProcess[]> { return apiFetch<AdmissionProcess[]>("/api/v1/processes/"); }
export function getAcademicAreas(): Promise<AcademicArea[]> { return apiFetch<AcademicArea[]>("/api/v1/academic-areas/"); }
export function getFaculties(): Promise<Faculty[]> { return apiFetch<Faculty[]>("/api/v1/faculties/"); }
export function getModalities(): Promise<Modality[]> { return apiFetch<Modality[]>("/api/v1/modalities/"); }

export function getAnalyticsOverview(primary: string | number, comparisons: Array<string | number> = [], filters: AnalyticsFilters = {}): Promise<ComparativeOverview> {
  const params = new URLSearchParams({ process: String(primary) });
  if (comparisons.length) params.set("compare", comparisons.slice(0, 3).map(String).join(","));
  if (filters.academicArea) params.set("academic_area", filters.academicArea);
  if (filters.faculty) params.set("faculty", filters.faculty);
  if (filters.modality) params.set("modality", filters.modality);
  return apiFetch<ComparativeOverview>(`/api/v1/analytics/overview/?${params.toString()}`);
}

export function usePublishedProcesses() { return useQuery({ queryKey: ["published-processes"], queryFn: getPublishedProcesses }); }
export function useAcademicAreas() { return useQuery({ queryKey: ["academic-areas"], queryFn: getAcademicAreas, staleTime: 300000 }); }
export function useFaculties() { return useQuery({ queryKey: ["faculties"], queryFn: getFaculties, staleTime: 300000 }); }
export function useModalities() { return useQuery({ queryKey: ["modalities"], queryFn: getModalities, staleTime: 300000 }); }

export function useAnalyticsOverview(primary: string, comparisons: string[], filters: AnalyticsFilters = {}) {
  return useQuery({ queryKey: ["analytics-overview", primary, comparisons, filters], queryFn: () => getAnalyticsOverview(primary, comparisons, filters), enabled: Boolean(primary) });
}
