import type { AdmissionProcess } from "../api/analytics.types";

/** Use the API's newest-first process order without changing unknown-ID error handling. */
export function normalizeComparisons(
  primaryId: string,
  comparisons: string[],
  processes: AdmissionProcess[],
): string[] {
  const order = new Map(processes.map((process, index) => [String(process.id), index]));
  return [...new Set(comparisons)]
    .filter((id) => id && id !== primaryId)
    .slice(0, 3)
    .sort((left, right) => (order.get(left) ?? Infinity) - (order.get(right) ?? Infinity));
}
