import type { MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";

export function Metric({ label, value }: { label: string; value: string }) {
  return <article className={styles.kpi}><span>{label}</span><strong>{value}</strong></article>;
}

export function ProcessMetrics({ item }: { item: MajorDetailProcess }) {
  const rate = item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
  return <div className={styles.detailProcessMetrics}>
    <strong>{formatProcessLabel(item.process)}</strong>
    <span>{formatNumber(item.total_results)} postulantes</span>
    <span>{formatNumber(item.admitted_count)} ingresantes</span>
    <span>{formatNumber(rate, 1)}% de ingreso</span>
    <span>{formatNumber(item.average_score, 2)} promedio</span>
  </div>;
}
