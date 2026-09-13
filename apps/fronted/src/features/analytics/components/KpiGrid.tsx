import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { Kpi } from "./Kpi";
import styles from "../pages/DashboardPage.module.css";
import { formatProcessLabel } from "../utils/processLabels";

type KpiGridProps = {
  overview: ProcessOverview;
  previous?: ProcessOverview;
};

function trend(value: number | null, previous: number | null, digits: number, suffix: string, label: string, invert = false) {
  if (value === null || previous === null) return undefined;
  const difference = value - previous;
  const direction = difference > 0 ? "up" : difference < 0 ? "down" : "flat";
  return {
    direction,
    value: `${difference > 0 ? "+" : difference < 0 ? "-" : ""}${formatNumber(Math.abs(difference), digits)}${suffix}`,
    context: `vs ${formatNumber(previous, digits)}${label} en el proceso anterior`,
    isPositive: invert ? difference <= 0 : difference >= 0,
  } as const;
}

export function KpiGrid({ overview, previous }: KpiGridProps) {
  const admissionRate = overview.total_results
    ? (overview.admitted_count / overview.total_results) * 100
    : 0;
  const previousRate = previous?.total_results
    ? (previous.admitted_count / previous.total_results) * 100
    : null;
  const previousLabel = previous ? formatProcessLabel(previous.process) : "";
  const withProcess = (item: ReturnType<typeof trend>) => item && { ...item, context: item.context.replace("el proceso anterior", previousLabel) };

  return (
    <div className={styles.kpis}>
      <Kpi label="Postulantes" value={formatNumber(overview.total_results)} trend={withProcess(trend(overview.total_results, previous?.total_results ?? null, 0, "", "", false))} />
      <Kpi label="Postulantes ausentes" value={formatNumber(overview.absent_count)} trend={withProcess(trend(overview.absent_count, previous?.absent_count ?? null, 0, " ausentes", "", true))} />
      <Kpi label="Ingresantes" value={formatNumber(overview.admitted_count)} trend={withProcess(trend(overview.admitted_count, previous?.admitted_count ?? null, 0, "", "", false))} />
      <Kpi label="Porcentaje de ingresantes" value={`${formatNumber(admissionRate, 1)}%`} trend={withProcess(trend(admissionRate, previousRate, 1, " pp", "%", false))} />
      <Kpi label="Puntaje máximo" value={formatNumber(overview.highest_score, 2)} trend={withProcess(trend(overview.highest_score === null ? null : Number(overview.highest_score), previous?.highest_score === null || previous?.highest_score === undefined ? null : Number(previous.highest_score), 2, " pts", "", false))} />
      <Kpi label="Puntaje promedio" value={formatNumber(overview.average_score, 2)} trend={withProcess(trend(overview.average_score === null ? null : Number(overview.average_score), previous?.average_score === null || previous?.average_score === undefined ? null : Number(previous.average_score), 2, " pts", "", false))} />
    </div>
  );
}
