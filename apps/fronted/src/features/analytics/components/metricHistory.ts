import type { ProcessMetrics } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";

export type MetricKey =
  | "total_results"
  | "admitted_count"
  | "admission_rate"
  | "absent_count"
  | "average_score"
  | "highest_score";

export type MetricOption = {
  key: MetricKey;
  label: string;
  digits: number;
  suffix?: string;
};

export const METRIC_OPTIONS: MetricOption[] = [
  { key: "total_results", label: "Postulantes", digits: 0 },
  { key: "admitted_count", label: "Ingresantes", digits: 0 },
  { key: "admission_rate", label: "Porcentaje de ingresantes", digits: 1, suffix: "%" },
  { key: "absent_count", label: "Postulantes ausentes", digits: 0 },
  { key: "average_score", label: "Puntaje promedio", digits: 2 },
  { key: "highest_score", label: "Puntaje máximo", digits: 2 },
];

const metricReaders: Record<MetricKey, (item: ProcessMetrics) => number | null> = {
  total_results: (item) => item.total_results,
  admitted_count: (item) => item.admitted_count,
  admission_rate: (item) => item.total_results > 0
    ? (item.admitted_count / item.total_results) * 100
    : null,
  absent_count: (item) => item.absent_count,
  average_score: (item) => item.average_score === null ? null : Number(item.average_score),
  highest_score: (item) => item.highest_score === null ? null : Number(item.highest_score),
};

export function getMetricValue(item: ProcessMetrics, metric: MetricKey): number | null {
  return metricReaders[metric](item);
}

export function formatMetricValue(value: number, metric: MetricOption): string {
  return `${formatNumber(value, metric.digits)}${metric.suffix ?? ""}`;
}
