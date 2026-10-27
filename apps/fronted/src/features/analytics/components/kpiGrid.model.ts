import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber, formatSignedDifference } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import { canCompareMinimumScores } from "./metricHistory";
import type { KpiTrendProps } from "./KpiTrend";

export const averageScoreNote =
  "El puntaje promedio considera solo a los ingresantes con puntaje válido.";

export type KpiMetric = {
  label: string;
  value: string;
  trend?: KpiTrendProps;
  description?: string;
  footnoteId?: string;
};

type MetricDefinition = {
  label: string;
  value: string;
  current: number | null;
  previous: number | null;
  digits: number;
  suffix: string;
  unit: string;
  invert?: boolean;
  neutral?: boolean;
  description?: string;
  footnoteId?: string;
};

function score(value: string | null | undefined) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getTrend(metric: MetricDefinition, processLabel: string): KpiTrendProps | undefined {
  if (metric.current === null || metric.previous === null) return undefined;

  const difference = metric.current - metric.previous;
  return {
    direction: difference > 0 ? "up" : difference < 0 ? "down" : "flat",
    value: formatSignedDifference(difference, metric.digits, metric.suffix),
    context: `vs ${formatNumber(metric.previous, metric.digits)}${metric.unit} en ${processLabel}`,
    isPositive: metric.invert ? difference <= 0 : difference >= 0,
    neutral: metric.neutral,
  };
}

export function buildKpiGridModel(
  overview: ProcessOverview,
  previous: ProcessOverview | undefined,
  variant: "process" | "career",
  averageNoteId: string,
) {
  const career = variant === "career";
  const previousLabel = previous ? formatProcessLabel(previous.process) : "el proceso anterior";
  const admissionRate = overview.total_results
    ? (overview.admitted_count / overview.total_results) * 100
    : 0;
  const previousRate = previous?.total_results
    ? (previous.admitted_count / previous.total_results) * 100
    : null;
  const minimumAvailable = previous && canCompareMinimumScores(overview, previous);
  const minimum = overview.minimum_admitted_score;
  const minimumDescription =
    (overview.admitted_score_modality_count ?? 0) > 1
      ? "Hay ingresantes de distintas modalidades. Selecciona una modalidad para consultar su mínimo."
      : "Menor puntaje obtenido por un ingresante en este proceso.";

  const definitions: MetricDefinition[] = [
    {
      label: "Postulantes",
      value: formatNumber(overview.total_results),
      current: overview.total_results,
      previous: previous?.total_results ?? null,
      digits: 0,
      suffix: " postulantes",
      unit: " postulantes",
    },
    ...(!career
      ? [
          {
            label: "Postulantes ausentes",
            value: formatNumber(overview.absent_count),
            current: overview.absent_count,
            previous: previous?.absent_count ?? null,
            digits: 0,
            suffix: " ausentes",
            unit: " ausentes",
            invert: true,
          },
        ]
      : []),
    {
      label: "Ingresantes",
      value: formatNumber(overview.admitted_count),
      current: overview.admitted_count,
      previous: previous?.admitted_count ?? null,
      digits: 0,
      suffix: " ingresantes",
      unit: " ingresantes",
    },
    {
      label: "Porcentaje de ingresantes",
      value: `${formatNumber(admissionRate, 1)}%`,
      current: admissionRate,
      previous: previousRate,
      digits: 1,
      suffix: " pp",
      unit: "%",
    },
    ...(career
      ? [
          {
            label: "Puntaje mínimo de ingreso",
            value: formatNumber(minimum != null && Number.isFinite(minimum) ? minimum : null, 2),
            current: minimum != null && Number.isFinite(minimum) ? minimum : null,
            previous:
              minimumAvailable && previous.minimum_admitted_score != null
                ? previous.minimum_admitted_score
                : null,
            digits: 2,
            suffix: " pts",
            unit: " pts",
            neutral: true,
            description: minimumDescription,
          },
        ]
      : []),
    {
      label: "Puntaje promedio",
      value: formatNumber(overview.average_score, 2),
      current: score(overview.average_score),
      previous: score(previous?.average_score),
      digits: 2,
      suffix: " pts",
      unit: " pts",
      neutral: career,
      description: averageScoreNote,
      footnoteId: averageNoteId,
    },
    {
      label: "Puntaje máximo",
      value: formatNumber(overview.highest_score, 2),
      current: score(overview.highest_score),
      previous: score(previous?.highest_score),
      digits: 2,
      suffix: " pts",
      unit: " pts",
      neutral: career,
      description: career ? "Máximo puntaje válido entre los ingresantes." : undefined,
    },
  ];

  return {
    previousLabel,
    metrics: definitions.map(({ current, previous: prior, ...metric }) => ({
      ...metric,
      trend: getTrend({ ...metric, current, previous: prior }, previousLabel),
    })),
  };
}
