import type { MajorOverview } from "../api/analytics.types";

export type SortKey = "total_results" | "admitted_count" | "admission_rate" | "average_score" | "major_name";
export type SortDirection = "asc" | "desc";

export function admissionRate(major: MajorOverview) {
  return major.total_results ? (major.admitted_count / major.total_results) * 100 : 0;
}

export function sortMajorValue(major: MajorOverview, sortKey: SortKey) {
  if (sortKey === "admission_rate") return admissionRate(major);
  if (sortKey === "average_score") return Number(major.average_score ?? -Infinity);
  if (sortKey === "major_name") return major.major_name;
  return major[sortKey];
}

export function sortMajors(majors: MajorOverview[], sortKey: SortKey, sortDirection: SortDirection) {
  return [...majors].sort((left, right) => {
    const leftValue = sortMajorValue(left, sortKey);
    const rightValue = sortMajorValue(right, sortKey);
    if (typeof leftValue === "string" && typeof rightValue === "string") {
      const comparison = leftValue.localeCompare(rightValue, "es");
      return sortDirection === "asc" ? comparison : -comparison;
    }
    const comparison = Number(leftValue) - Number(rightValue);
    return sortDirection === "asc" ? comparison : -comparison;
  });
}
