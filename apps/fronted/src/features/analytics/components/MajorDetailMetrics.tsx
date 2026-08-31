import type { MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";

type MetricProps = { label: string; value: string };

type ComparisonMetricProps = MetricProps & { delta: string };

export function Metric({ label, value }: MetricProps) {
  return <article className={styles.kpi}><span>{label}</span><strong>{value}</strong></article>;
}

function admissionRate(item: MajorDetailProcess) {
  return item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
}

function formatDelta(value: number | null, baseline: number | null, decimals = 0, suffix = "") {
  if (value === null || baseline === null) return "—";
  const difference = value - baseline;
  const sign = difference > 0 ? "+" : "";
  return `${sign}${formatNumber(difference, decimals)}${suffix} vs principal`;
}

function ComparisonMetric({ label, value, delta }: ComparisonMetricProps) {
  return <div className={styles.comparisonMetric}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{delta}</small>
  </div>;
}

export function ProcessMetrics({ item, baseline }: { item: MajorDetailProcess; baseline: MajorDetailProcess }) {
  const itemRate = admissionRate(item);
  const baselineRate = admissionRate(baseline);
  const itemAverage = item.average_score === null ? null : Number(item.average_score);
  const baselineAverage = baseline.average_score === null ? null : Number(baseline.average_score);

  const metrics: ComparisonMetricProps[] = [
    {
      label: "Postulantes",
      value: formatNumber(item.total_results),
      delta: formatDelta(item.total_results, baseline.total_results),
    },
    {
      label: "Ingresantes",
      value: formatNumber(item.admitted_count),
      delta: formatDelta(item.admitted_count, baseline.admitted_count),
    },
    {
      label: "Tasa de ingreso",
      value: `${formatNumber(itemRate, 1)}%`,
      delta: formatDelta(itemRate, baselineRate, 1, " pp"),
    },
    {
      label: "Puntaje promedio",
      value: formatNumber(item.average_score, 2),
      delta: formatDelta(itemAverage, baselineAverage, 2),
    },
  ];

  return <article className={styles.detailProcessMetrics}>
    <header>
      <strong>{formatProcessLabel(item.process)}</strong>
      <span>Comparado con {formatProcessLabel(baseline.process)}</span>
    </header>
    <div className={styles.comparisonMetricGrid}>
      {metrics.map((metric) => <ComparisonMetric key={metric.label} {...metric} />)}
    </div>
  </article>;
}
