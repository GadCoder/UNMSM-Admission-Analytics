import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { Kpi } from "./Kpi";
import styles from "../pages/DashboardPage.module.css";

type KpiGridProps = {
  overview: ProcessOverview;
};

export function KpiGrid({ overview }: KpiGridProps) {
  const admissionRate = overview.total_results
    ? (overview.admitted_count / overview.total_results) * 100
    : 0;

  return (
    <div className={styles.kpis}>
      <Kpi label="Postulantes" value={formatNumber(overview.total_results)} />
      <Kpi label="Postulantes ausentes" value={formatNumber(overview.absent_count)} />
      <Kpi label="Ingresantes" value={formatNumber(overview.admitted_count)} />
      <Kpi label="Porcentaje de ingresantes" value={`${formatNumber(admissionRate, 1)}%`} />
      <Kpi label="Puntaje máximo" value={formatNumber(overview.highest_score, 2)} />
      <Kpi label="Puntaje promedio" value={formatNumber(overview.average_score, 2)} />
    </div>
  );
}
