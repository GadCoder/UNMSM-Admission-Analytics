import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { isHighestValue, percentage, type ComparisonMetricValues } from "./comparisonMetrics";

export type ComparisonMetricRow = {
  label: string;
  values: string[];
  comparison: Array<number | null>;
};

export function buildComparisonMetricRows(
  overviews: ProcessOverview[],
  metricValues: ComparisonMetricValues,
): ComparisonMetricRow[] {
  return [
    {
      label: "Postulantes",
      values: overviews.map((overview) => formatNumber(overview.total_results)),
      comparison: metricValues.applicants,
    },
    {
      label: "Postulantes ausentes",
      values: overviews.map((overview) => formatNumber(overview.absent_count)),
      comparison: metricValues.absent,
    },
    {
      label: "Porcentaje de ausentes",
      values: overviews.map((overview) => `${formatNumber(percentage(overview.absent_count, overview.total_results), 1)}%`),
      comparison: metricValues.absentRate,
    },
    {
      label: "Ingresantes",
      values: overviews.map((overview) => formatNumber(overview.admitted_count)),
      comparison: metricValues.entrants,
    },
    {
      label: "Porcentaje de ingresantes",
      values: overviews.map((overview) => `${formatNumber(percentage(overview.admitted_count, overview.total_results), 1)}%`),
      comparison: metricValues.admissionRate,
    },
    {
      label: "Puntaje máximo",
      values: overviews.map((overview) => overview.highest_score === null ? "—" : formatNumber(Number(overview.highest_score), 2)),
      comparison: metricValues.highest,
    },
    {
      label: "Puntaje promedio",
      values: overviews.map((overview) => overview.average_score === null ? "—" : formatNumber(Number(overview.average_score), 2)),
      comparison: metricValues.average,
    },
  ];
}

export function isComparisonWinner(row: ComparisonMetricRow, index: number): boolean {
  return isHighestValue(row.comparison[index], row.comparison);
}
