import { useId } from "react";

import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber, formatSignedDifference } from "../utils/formatters";
import { canCompareMinimumScores } from "./metricHistory";
import { Kpi } from "./Kpi";
import styles from "../pages/DashboardPage.module.css";
import { formatProcessLabel } from "../utils/processLabels";

type KpiGridProps = {
  overview: ProcessOverview;
  previous?: ProcessOverview;
  variant?: "process" | "career";
};

function trend(value: number | null, previous: number | null, digits: number, suffix: string, label: string, invert = false) {
  if (value === null || previous === null) return undefined;
  const difference = value - previous;
  const direction = difference > 0 ? "up" : difference < 0 ? "down" : "flat";
  return {
    direction,
    value: formatSignedDifference(difference, digits, suffix),
    context: `vs ${formatNumber(previous, digits)}${label} en el proceso anterior`,
    isPositive: invert ? difference <= 0 : difference >= 0,
  } as const;
}

export function KpiGrid({ overview, previous, variant = "process" }: KpiGridProps) {
  const averageNoteId = useId();
  const averageNote = "El puntaje promedio considera solo a los ingresantes con puntaje válido.";
  const admissionRate = overview.total_results
    ? (overview.admitted_count / overview.total_results) * 100
    : 0;
  const previousRate = previous?.total_results
    ? (previous.admitted_count / previous.total_results) * 100
    : null;
  const previousLabel = previous ? formatProcessLabel(previous.process) : "";
  const withProcess = (item: ReturnType<typeof trend>) => item && { ...item, context: item.context.replace("el proceso anterior", previousLabel) };

  const career = variant === "career";
  const scoreTrend = (value: string | null, prior: string | null | undefined, neutral = career) => {
    const item = withProcess(trend(value === null ? null : Number(value), prior == null ? null : Number(prior), 2, " pts", " pts"));
    return item && { ...item, neutral };
  };
  const minimumAvailable = previous && canCompareMinimumScores(overview, previous);
  const minimumTrend = minimumAvailable
    ? { ...withProcess(trend(overview.minimum_admitted_score!, previous.minimum_admitted_score!, 2, " pts", " pts"))!, neutral: true }
    : { direction: "unavailable" as const, value: "No disponible", context: "Se necesitan puntajes válidos de la misma modalidad en el proceso anterior.", isPositive: false, neutral: true };
  const minimumDescription = (overview.admitted_score_modality_count ?? 0) > 1
    ? "Hay ingresantes de distintas modalidades. Selecciona una modalidad para consultar su mínimo."
    : "Menor puntaje obtenido por un ingresante en este proceso.";
  const average = <Kpi label="Puntaje promedio" value={formatNumber(overview.average_score, 2)} trend={scoreTrend(overview.average_score, previous?.average_score, true)} description={averageNote} footnoteId={averageNoteId} />;
  const highest = <Kpi label="Puntaje máximo" value={formatNumber(overview.highest_score, 2)} trend={scoreTrend(overview.highest_score, previous?.highest_score)} description={career ? "Máximo de todos los registros con puntaje, sin filtrar por estado." : undefined} />;

  return (
    <>
      {previousLabel && <p className={styles.kpiComparisonContext}>Variaciones respecto a {previousLabel}</p>}
      <div className={styles.kpis} aria-label={career ? "Indicadores de la carrera" : "Indicadores del proceso"}>
        <Kpi label="Postulantes" value={formatNumber(overview.total_results)} trend={withProcess(trend(overview.total_results, previous?.total_results ?? null, 0, " postulantes", " postulantes", false))} />
        {!career && <Kpi label="Postulantes ausentes" value={formatNumber(overview.absent_count)} trend={withProcess(trend(overview.absent_count, previous?.absent_count ?? null, 0, " ausentes", " ausentes", true))} />}
        <Kpi label="Ingresantes" value={formatNumber(overview.admitted_count)} trend={withProcess(trend(overview.admitted_count, previous?.admitted_count ?? null, 0, " ingresantes", " ingresantes", false))} />
        <Kpi label="Porcentaje de ingresantes" value={`${formatNumber(admissionRate, 1)}%`} trend={withProcess(trend(admissionRate, previousRate, 1, " pp", "%", false))} />
        {career ? <>
          <Kpi label="Puntaje mínimo de ingreso" value={formatNumber(overview.minimum_admitted_score != null && Number.isFinite(overview.minimum_admitted_score) ? overview.minimum_admitted_score : null, 2)} trend={minimumTrend} description={minimumDescription} />
          {average}
          {highest}
        </> : <>{highest}{average}</>}
      </div>
      <p id={averageNoteId} className={styles.kpiFootnote}><span aria-hidden="true">* </span>{averageNote}</p>
    </>
  );
}
