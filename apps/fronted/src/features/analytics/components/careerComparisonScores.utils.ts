import type { MajorDetailProcess } from "../api/analytics.types";
import {
  canCompareAdmittedScores,
  formatCareerComparisonMetric,
  getCareerComparisonMetricValue,
} from "../utils/careerComparison";

export const scoreKeys = ["minimum_admitted_score", "average_score", "highest_score"] as const;
export type ScoreKey = (typeof scoreKeys)[number];
export const scoreLabels: Record<ScoreKey, string> = {
  minimum_admitted_score: "Mínimo",
  average_score: "Promedio",
  highest_score: "Máximo",
};

export type CareerScoreSelection = {
  id: number;
  label: string;
  current?: MajorDetailProcess;
};

export type CareerScoreRow = CareerScoreSelection & {
  values: Record<ScoreKey, number | null>;
  status: string | null;
  inconsistent: boolean;
};

export function prepareCareerScoreRows(selected: CareerScoreSelection[]): CareerScoreRow[] {
  const anchor = selected
    .map(({ current }) => current)
    .find((record) => record && canCompareAdmittedScores(record, record));
  return selected.map((career) => {
    const current = career.current;
    const hasPopulation = Boolean(current && canCompareAdmittedScores(current, current));
    const comparable = Boolean(
      current && anchor && hasPopulation && canCompareAdmittedScores(anchor, current),
    );
    const values = Object.fromEntries(
      scoreKeys.map((key) => [
        key,
        comparable && current ? getCareerComparisonMetricValue(current, key) : null,
      ]),
    ) as Record<ScoreKey, number | null>;
    return {
      ...career,
      values,
      status:
        !current || current.total_results === 0
          ? "Sin datos"
          : !hasPopulation
            ? "—"
            : !comparable
              ? "No comparable"
              : null,
      inconsistent:
        values.minimum_admitted_score !== null &&
        values.highest_score !== null &&
        (values.minimum_admitted_score > values.highest_score ||
          (values.average_score !== null &&
            (values.average_score < values.minimum_admitted_score ||
              values.average_score > values.highest_score))),
    };
  });
}

export function formatCareerScore(value: number | null, key: ScoreKey) {
  return value === null ? "—" : formatCareerComparisonMetric(value, key);
}

export type CareerScoreDomain = { min: number; max: number; ticks: number[] };

export function getCareerScoreDomain(values: number[]): CareerScoreDomain {
  const finite = values.filter(Number.isFinite);
  const observedMin = finite.length ? Math.min(...finite) : 0;
  const observedMax = finite.length ? Math.max(...finite) : 1;
  const span = observedMax - observedMin || Math.max(Math.abs(observedMax) * 0.1, 1);
  const rawStep = span / 4;
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / power;
  const step =
    (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 3.5 ? 2.5 : fraction <= 7.5 ? 5 : 10) *
    power;
  const padding = step * 0.04;
  const lower =
    observedMin >= 0
      ? Math.max(0, Math.floor((observedMin - padding) / step) * step)
      : Math.floor((observedMin - padding) / step) * step;
  const upper = Math.ceil((observedMax + padding) / step) * step || step;
  const ticks: number[] = [];
  for (let value = lower; value <= upper + step * 0.01; value += step)
    ticks.push(Number(value.toPrecision(12)));
  return { min: lower, max: upper, ticks };
}
