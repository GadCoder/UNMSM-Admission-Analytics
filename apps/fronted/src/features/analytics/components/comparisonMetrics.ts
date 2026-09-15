import type { ProcessOverview } from "../api/analytics.types";

type ComparableValue = number | null;

export type ComparisonMetricValues = {
  applicants: number[];
  admitted: number[];
  admissionRate: number[];
  absent: number[];
  absenceRate: number[];
  average: ComparableValue[];
  highest: ComparableValue[];
};

export function percentage(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

export function comparisonState(value: ComparableValue, values: ComparableValue[]) {
  if (value === null) return { label: "—", isWinner: false };
  const comparable = values.filter((item): item is number => item !== null);
  if (comparable.length < 2 || comparable.every((item) => item === comparable[0])) {
    return { label: "Igual", isWinner: false };
  }
  const isWinner = value === Math.max(...comparable);
  return { label: isWinner ? "Mayor" : "Menor", isWinner };
}

export function scoreValue(value: string | null) {
  return value === null ? null : Number(value);
}

export function buildComparisonMetricValues(overviews: ProcessOverview[]): ComparisonMetricValues {
  return {
    applicants: overviews.map((item) => item.total_results),
    admitted: overviews.map((item) => item.admitted_count),
    admissionRate: overviews.map((item) => percentage(item.admitted_count, item.total_results)),
    absent: overviews.map((item) => item.absent_count),
    absenceRate: overviews.map((item) => percentage(item.absent_count, item.total_results)),
    average: overviews.map((item) => scoreValue(item.average_score)),
    highest: overviews.map((item) => scoreValue(item.highest_score)),
  };
}
