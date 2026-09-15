import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { percentage } from "./comparisonMetrics";

export type MetricKey = "applicants" | "entrants" | "admissionRate" | "absentRate" | "average" | "highest";
export type MetricDefinition = { label: string; unit: "count" | "percent" | "points"; getValue: (overview: ProcessOverview) => number | null };

export const kpiMetrics: Record<MetricKey, MetricDefinition> = {
  applicants: { label: "Postulantes", unit: "count", getValue: (overview) => overview.total_results },
  entrants: { label: "Ingresantes", unit: "count", getValue: (overview) => overview.admitted_count },
  admissionRate: { label: "% de ingresantes", unit: "percent", getValue: (overview) => percentage(overview.admitted_count, overview.total_results) },
  absentRate: { label: "% de ausentes", unit: "percent", getValue: (overview) => percentage(overview.absent_count, overview.total_results) },
  average: { label: "Puntaje promedio", unit: "points", getValue: (overview) => overview.average_score === null ? null : Number(overview.average_score) },
  highest: { label: "Puntaje máximo", unit: "points", getValue: (overview) => overview.highest_score === null ? null : Number(overview.highest_score) },
};

export function formatMetricValue(value: number | null, metric: MetricDefinition) {
  if (value === null) return "Sin dato";
  const decimals = metric.unit === "count" ? 0 : 2;
  const suffix = metric.unit === "percent" ? "%" : metric.unit === "points" ? " pts" : "";
  return `${formatNumber(value, decimals)}${suffix}`;
}

export function formatMetricAxisValue(value: number, metric: MetricDefinition) {
  const suffix = metric.unit === "percent" ? "%" : metric.unit === "points" ? " pts" : "";
  return `${formatNumber(value, metric.unit === "count" ? 0 : 1)}${suffix}`;
}
