import type { ProcessOverview } from "../../shared/api/analytics.types";
import { formatNumber } from "./formatters";
import { Kpi } from "./Kpi";
import styles from "./DashboardPage.module.css";

type KpiGridProps = {
  overview: ProcessOverview;
};

export function KpiGrid({ overview }: KpiGridProps) {
  const admissionRate = overview.total_results
    ? (overview.admitted_count / overview.total_results) * 100
    : 0;

  return (
    <div className={styles.kpis}>
      <Kpi label="Total de resultados" value={formatNumber(overview.total_results)} />
      <Kpi label="Admitidos" value={formatNumber(overview.admitted_count)} />
      <Kpi label="Ausentes" value={formatNumber(overview.absent_count)} />
      <Kpi label="Tasa de admisión" value={`${formatNumber(admissionRate, 1)}%`} />
      <Kpi label="Promedio" value={formatNumber(overview.average_score, 2)} />
      <Kpi label="Puntaje más alto" value={formatNumber(overview.highest_score, 2)} />
    </div>
  );
}
