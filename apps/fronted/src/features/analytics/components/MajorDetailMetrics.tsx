import type { MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";

export function Metric({ label, value }: { label: string; value: string }) {
  return <article className={styles.kpi}><span>{label}</span><strong>{value}</strong></article>;
}

function signed(value: number, decimals = 0) {
  return `${value > 0 ? "+" : ""}${formatNumber(value, decimals)}`;
}

function rate(item: MajorDetailProcess) {
  return item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
}

export function ProcessMetrics({ item, baseline }: { item: MajorDetailProcess; baseline: MajorDetailProcess }) {
  const metrics = [
    ["Postulantes", formatNumber(item.total_results), `${signed(item.total_results - baseline.total_results)} vs principal`],
    ["Ingresantes", formatNumber(item.admitted_count), `${signed(item.admitted_count - baseline.admitted_count)} vs principal`],
    ["Tasa de ingreso", `${formatNumber(rate(item), 1)}%`, `${signed(rate(item) - rate(baseline), 1)} pp vs principal`],
    ["Puntaje promedio", formatNumber(item.average_score, 2), `${signed(Number(item.average_score) - Number(baseline.average_score), 2)} vs principal`],
  ];

  return <article className={styles.detailProcessMetrics}>
    <header><strong>{formatProcessLabel(item.process)}</strong><span>Comparado con {formatProcessLabel(baseline.process)}</span></header>
    <div className={styles.comparisonMetricGrid}>
      {metrics.map(([label, value, delta]) => <div className={styles.comparisonMetric} key={label}>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{delta}</small>
      </div>)}
    </div>
  </article>;
}
