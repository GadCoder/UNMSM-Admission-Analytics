import type { AdmissionProcess, ProcessMetrics } from "../api/analytics.types";
import { useState } from "react";
import { formatNumber } from "./formatters";

export type CareerComparisonMetricKey =
  | "admission_rate"
  | "total_results"
  | "admitted_count"
  | "absent_count"
  | "applicants_per_admitted"
  | "minimum_admitted_score"
  | "average_score"
  | "highest_score";

export type CareerComparisonRecord = ProcessMetrics;

export type CareerComparisonMetricOption = {
  key: CareerComparisonMetricKey;
  label: string;
  digits: number;
  suffix?: string;
};

export const CAREER_COMPARISON_METRICS: CareerComparisonMetricOption[] = [
  { key: "admission_rate", label: "Tasa de ingreso", digits: 1, suffix: "%" },
  { key: "total_results", label: "Postulantes registrados", digits: 0 },
  { key: "admitted_count", label: "Ingresantes", digits: 0 },
  { key: "applicants_per_admitted", label: "Postulantes por ingresante", digits: 2 },
  { key: "minimum_admitted_score", label: "Puntaje mínimo de ingreso", digits: 4 },
  { key: "average_score", label: "Puntaje promedio de ingresantes", digits: 2 },
  { key: "highest_score", label: "Puntaje máximo de ingresantes", digits: 2 },
];

function finite(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasSingleKnownScoreModality(item: CareerComparisonRecord): boolean {
  return item.admitted_score_modality_count === 1 && Boolean(item.admitted_score_modality?.trim());
}

/** Score aggregates describe admitted students and are only comparable with known matching populations. */
export function canCompareAdmittedScores(
  left: CareerComparisonRecord,
  right: CareerComparisonRecord,
): boolean {
  return (
    hasSingleKnownScoreModality(left) &&
    hasSingleKnownScoreModality(right) &&
    left.admitted_score_modality === right.admitted_score_modality
  );
}

/** Preserve the existing minimum-score rule: compare only finite minima from one known modality. */
export function canCompareMinimumScores(
  left: CareerComparisonRecord,
  right: CareerComparisonRecord,
): boolean {
  return (
    finite(left.minimum_admitted_score) !== null &&
    finite(right.minimum_admitted_score) !== null &&
    canCompareAdmittedScores(left, right)
  );
}

function getScore(
  item: CareerComparisonRecord,
  key: "minimum_admitted_score" | "average_score" | "highest_score",
) {
  if (!hasSingleKnownScoreModality(item)) return null;
  return finite(item[key]);
}

const hasRecordedResults = (item: CareerComparisonRecord) =>
  Number.isFinite(item.total_results) && item.total_results > 0;

const metricReaders: Record<
  CareerComparisonMetricKey,
  (item: CareerComparisonRecord | null | undefined) => number | null
> = {
  admission_rate: (item) =>
    item && item.total_results > 0
      ? finite((item.admitted_count / item.total_results) * 100)
      : null,
  total_results: (item) => (item && hasRecordedResults(item) ? finite(item.total_results) : null),
  admitted_count: (item) => (item && hasRecordedResults(item) ? finite(item.admitted_count) : null),
  absent_count: (item) => (item && hasRecordedResults(item) ? finite(item.absent_count) : null),
  applicants_per_admitted: (item) =>
    item && item.admitted_count > 0 ? finite(item.total_results / item.admitted_count) : null,
  minimum_admitted_score: (item) => (item ? getScore(item, "minimum_admitted_score") : null),
  average_score: (item) => (item ? getScore(item, "average_score") : null),
  highest_score: (item) => (item ? getScore(item, "highest_score") : null),
};

export function getCareerComparisonMetricValue(
  item: CareerComparisonRecord | null | undefined,
  metric: CareerComparisonMetricKey,
): number | null {
  return metricReaders[metric](item);
}

export function formatCareerComparisonMetric(
  value: number | null,
  metric: CareerComparisonMetricKey,
  precision?: number,
): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const option = CAREER_COMPARISON_METRICS.find((item) => item.key === metric);
  return `${formatNumber(value, precision ?? option?.digits ?? 0)}${option?.suffix ?? ""}`;
}

export type CareerMetricValue = { id: number; name: string; value: number | null };
export type ComparisonInsightRecord = {
  name: string;
  admissionRate: number | null;
  applicants: number | null;
  admitted: number | null;
};
export type ComparisonInsightType =
  "admission_rate" | "demand" | "admitted" | "applicants_per_admitted" | "score" | "generic";
export type ComparisonInsight = { type: ComparisonInsightType; text: string };
export function buildComparisonInsights(records: ComparisonInsightRecord[]): ComparisonInsight[] {
  const insights: ComparisonInsight[] = [];
  const rates = records.filter(
    (record) => record.admissionRate !== null && Number.isFinite(record.admissionRate),
  );
  if (rates.length >= 2) {
    const lowest = Math.min(...rates.map(({ admissionRate }) => admissionRate!));
    const highest = Math.max(...rates.map(({ admissionRate }) => admissionRate!));
    if (highest - lowest >= 1) {
      const low = rates.filter(({ admissionRate }) => admissionRate === lowest);
      const high = rates.filter(({ admissionRate }) => admissionRate === highest);
      const names = (items: typeof rates) => items.map(({ name }) => name).join(", ");
      insights.push({
        type: "admission_rate",
        text: `${names(low)} ${low.length > 1 ? "registraron" : "registró"} una tasa de ingreso de ${formatCareerComparisonMetric(lowest, "admission_rate")}, frente al ${formatCareerComparisonMetric(highest, "admission_rate")} de ${names(high)}: una diferencia de ${formatNumber(highest - lowest, 1)} puntos porcentuales.`,
      });
    }
  }
  const demand = records.filter(
    ({ applicants }) => applicants !== null && Number.isFinite(applicants),
  );
  if (demand.length >= 2) {
    const highest = Math.max(...demand.map(({ applicants }) => applicants!));
    const lowest = Math.min(...demand.map(({ applicants }) => applicants!));
    if (highest > lowest) {
      const lowestMajors = demand
        .filter(({ applicants }) => applicants === lowest)
        .map(({ name }) => name)
        .join(", ");
      const highNames = demand.filter(({ applicants }) => applicants === highest);
      const highNameText = highNames.map(({ name }) => name).join(", ");
      const verb = highNames.length > 1 ? "registraron" : "registró";
      insights.push({
        type: "demand",
        text: `${highNameText} ${verb} la mayor demanda, con ${formatNumber(highest, 0)} postulantes, frente a ${formatNumber(lowest, 0)} en ${lowestMajors}.`,
      });
    }
  }
  return insights.slice(0, 2);
}
export type MetricRanking = {
  eligible: CareerMetricValue[];
  minimum: CareerMetricValue[];
  maximum: CareerMetricValue[];
  scope: string | null;
  tied: boolean;
  precision: number;
};

/** Build rank inputs and reject admitted-score comparisons across different known populations. */
export function getComparableCareerMetricValues(
  records: Array<{ id: number; name: string; record?: CareerComparisonRecord | null }>,
  metric: CareerComparisonMetricKey,
): CareerMetricValue[] {
  const scoreMetric =
    metric === "minimum_admitted_score" || metric === "average_score" || metric === "highest_score";
  const eligible = records.flatMap(({ id, name, record }) => {
    const value = getCareerComparisonMetricValue(record, metric);
    return value === null || !Number.isFinite(value) ? [] : [{ id, name, record: record!, value }];
  });
  if (!scoreMetric) return eligible.map(({ id, name, value }) => ({ id, name, value }));
  const populations = new Set(eligible.map(({ record }) => record.admitted_score_modality));
  if (populations.size > 1) return [];
  return eligible.map(({ id, name, value }) => ({ id, name, value }));
}

/** Rank raw finite values and avoid unique-winner claims when display precision hides a tie. */
export function rankCareerMetric(
  values: CareerMetricValue[],
  metric: CareerComparisonMetricKey,
  selectedCount = values.length,
): MetricRanking {
  const eligible = values.filter((item) => item.value !== null && Number.isFinite(item.value));
  if (eligible.length < 2)
    return {
      eligible,
      minimum: [],
      maximum: [],
      scope: null,
      tied: false,
      precision: CAREER_COMPARISON_METRICS.find((item) => item.key === metric)!.digits,
    };
  let digits = CAREER_COMPARISON_METRICS.find((item) => item.key === metric)!.digits;
  const min = Math.min(...eligible.map(({ value }) => value!));
  const max = Math.max(...eligible.map(({ value }) => value!));
  const extremeIsHiddenByRounding = (extreme: number) => {
    const matching = eligible.filter(
      ({ value }) => Number(value!.toFixed(digits)) === Number(extreme.toFixed(digits)),
    );
    return matching.some(({ value }) => value !== extreme);
  };
  while (digits < 8 && (extremeIsHiddenByRounding(min) || extremeIsHiddenByRounding(max)))
    digits += 1;
  const minimum = eligible.filter(({ value }) => value === min);
  const maximum = eligible.filter(({ value }) => value === max);
  const scope =
    eligible.length === selectedCount
      ? null
      : `Entre las carreras con datos (${eligible.length} de ${selectedCount})`;
  return {
    eligible,
    minimum,
    maximum,
    scope,
    tied: minimum.length > 1 && maximum.length > 1 && min === max,
    precision: digits,
  };
}

function romanValue(raw: string): number | null {
  const text = raw.trim().toUpperCase();
  if (!/^[IVXLCDM]+$/.test(text)) return null;
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let index = 0; index < text.length; index += 1) {
    const current = values[text[index]];
    const next = values[text[index + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  return total;
}

function sequenceValue(sequence: string): number {
  const token =
    sequence
      .trim()
      .split(/[-\s]+/)
      .at(-1) ?? "";
  const numeric = Number(token);
  if (token && Number.isFinite(numeric)) return numeric;
  return romanValue(token) ?? Number.MAX_SAFE_INTEGER;
}

export function compareAdmissionProcesses(left: AdmissionProcess, right: AdmissionProcess): number {
  return (
    left.year - right.year ||
    sequenceValue(left.sequence) - sequenceValue(right.sequence) ||
    left.id - right.id
  );
}

export function mergeCareerHistory<T extends CareerComparisonRecord>(
  selected: T[],
  history: T[],
  selectedProcessId?: number,
): T[] {
  const byId = new Map<number, T>();
  const combined = [...history, ...selected];
  const cutoff = combined.find((item) => item.process.id === selectedProcessId)?.process;
  for (const item of combined) {
    if (cutoff && compareAdmissionProcesses(item.process, cutoff) > 0) continue;
    byId.set(item.process.id, item);
  }
  return [...byId.values()].sort((a, b) => compareAdmissionProcesses(a.process, b.process));
}

export type CareerComparisonSeries = {
  id: number | string;
  label: string;
  items: CareerComparisonRecord[];
};
export type AlignedCareerHistory = {
  processes: AdmissionProcess[];
  series: Array<{ id: number | string; label: string; values: Array<number | null> }>;
};

export type CareerHistoryDomain = { min: number; max: number; ticks: number[] };

function niceStep(rawStep: number) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / power;
  const niceFraction =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return niceFraction * power;
}

/** Stable chart scale derived from every selected series, independent of interaction state. */
export function getCareerHistoryDomain(
  aligned: AlignedCareerHistory,
  metric: CareerComparisonMetricKey,
): CareerHistoryDomain {
  const values = aligned.series.flatMap((series) =>
    series.values.filter((value): value is number => value !== null && Number.isFinite(value)),
  );
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 1;
  const isRate = metric === "admission_rate";
  const nonNegative =
    isRate ||
    ["total_results", "admitted_count", "absent_count", "applicants_per_admitted"].includes(metric);
  if (isRate) {
    const max = maxValue <= 0 ? 1 : maxValue;
    const step = niceStep(max / 4);
    const roundedMax = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let value = roundedMax; value >= -step * 0.01; value -= step)
      ticks.push(Number(value.toPrecision(12)));
    return { min: 0, max: roundedMax, ticks };
  }
  const min = nonNegative ? 0 : minValue;
  const rawSpan = maxValue - min || Math.max(Math.abs(maxValue) * 0.1, 1);
  const step = niceStep(rawSpan / 4);
  const lower = nonNegative ? 0 : Math.floor((min - rawSpan * 0.08) / step) * step;
  const upper = Math.ceil((maxValue + rawSpan * 0.08) / step) * step || step;
  const ticks: number[] = [];
  for (let value = upper; value >= lower - step * 0.01; value -= step)
    ticks.push(Number(value.toPrecision(12)));
  return { min: lower, max: upper, ticks };
}

export type CareerHistoryInsight = { text: string; metric: CareerComparisonMetricKey };

/** Describe one defensible earliest-to-latest endpoint change in the selected metric. */
export function buildCareerHistoryInsight(
  aligned: AlignedCareerHistory,
  metric: CareerComparisonMetricKey,
): CareerHistoryInsight | null {
  const observations = aligned.series.flatMap((series) => {
    const points = series.values.flatMap((value, index) =>
      value === null || !Number.isFinite(value)
        ? []
        : [{ value, process: aligned.processes[index] }],
    );
    if (points.length < 2) return [];
    const first = points[0];
    const last = points.at(-1)!;
    return [{ series, first, last, change: last.value - first.value }];
  });
  if (!observations.length) return null;
  const magnitude = Math.max(...observations.map(({ change }) => Math.abs(change)));
  const minimumChange =
    metric === "admission_rate"
      ? 1
      : metric === "applicants_per_admitted"
        ? 0.1
        : metric.includes("score")
          ? 0.1
          : 1;
  if (magnitude < minimumChange) return null;
  const leaders = observations.filter(
    ({ change }) => Math.abs(Math.abs(change) - magnitude) < 1e-8,
  );
  const processLabel = (process: AdmissionProcess) => {
    const sequence = process.sequence.includes("-")
      ? process.sequence.slice(process.sequence.lastIndexOf("-") + 1)
      : process.sequence;
    return `${process.year}-${sequence}`;
  };
  // Select a stable representative when endpoint changes tie. The copy reports
  // only that series' observed endpoints and makes no claim of a unique leader.
  const { series, first, last, change } = leaders[0];
  const firstLabel = formatCareerComparisonMetric(first.value, metric);
  const lastLabel = formatCareerComparisonMetric(last.value, metric);
  const difference = formatCareerComparisonMetric(Math.abs(change), metric);
  const comparison =
    metric === "admission_rate"
      ? `${formatNumber(Math.abs(change), 1)} puntos porcentuales`
      : difference;
  const direction = change > 0 ? "un aumento" : "una disminución";
  const metricLabel = CAREER_COMPARISON_METRICS.find(
    (item) => item.key === metric,
  )?.label.toLowerCase();
  const subject =
    metric === "admission_rate"
      ? `La tasa de ingreso de ${series.label} pasó`
      : metric === "total_results"
        ? `Los postulantes registrados de ${series.label} pasaron`
        : metric === "admitted_count"
          ? `Los ingresantes de ${series.label} pasaron`
          : metric === "absent_count"
            ? `Los ausentes de ${series.label} pasaron`
            : metric === "applicants_per_admitted"
              ? `La relación de postulantes por ingresante de ${series.label} pasó`
              : `El ${metricLabel} de ${series.label} pasó`;
  return {
    metric,
    text: `${subject} de ${firstLabel} en ${processLabel(first.process)} a ${lastLabel} en ${processLabel(last.process)}, ${direction} de ${comparison}.`,
  };
}

const SERIES_COLORS = ["#8f5658", "#2e8b57", "#c58a2b", "#c54b4b", "#6f4043", "#6e5e5f"];

/** Assign a never-reused session slot so removing or reordering careers keeps their identity. */
export function assignCareerSeriesSlots(
  slotMap: Map<number | string, number>,
  ids: Array<number | string>,
): Map<number | string, number> {
  const nextMap = new Map(slotMap);
  let nextSlot = slotMap.size ? Math.max(...slotMap.values()) + 1 : 0;
  for (const id of ids) {
    if (!nextMap.has(id)) nextMap.set(id, nextSlot++);
  }
  return nextMap.size === slotMap.size ? slotMap : nextMap;
}

/** Keep identity assignments through adds, removals, and URL order changes during this mount. */
export function useCareerSeriesSlots(
  ids: Array<number | string>,
): ReadonlyMap<number | string, number> {
  const [slots, setSlots] = useState(() => new Map<number | string, number>());
  const reconciled = assignCareerSeriesSlots(slots, ids);
  if (reconciled !== slots) setSlots(reconciled);
  return reconciled;
}

export function getCareerSeriesStyle(slot: number) {
  const markerIndex = slot % 4;
  const color = SERIES_COLORS[slot % SERIES_COLORS.length];
  const bits = slot.toString(2);
  const dash =
    slot === 0
      ? ""
      : [...bits]
          .flatMap((bit, index) => [
            bit === "1" ? "8" : "3",
            index === bits.length - 1 ? String(2 + bits.length) : "2",
          ])
          .join(" ");
  return { color, markerIndex, dash };
}

export function getSharedHistoryCoverage(aligned: AlignedCareerHistory) {
  const sharedProcessCount = aligned.processes.filter(
    (_, index) =>
      aligned.series.length > 0 && aligned.series.every((series) => series.values[index] !== null),
  ).length;
  return {
    sharedProcessCount,
    hasMinimumCoverage: aligned.series.length >= 2 && sharedProcessCount >= 2,
  };
}

export function alignCareerHistory(
  series: CareerComparisonSeries[],
  processes: AdmissionProcess[],
  metric: CareerComparisonMetricKey,
  selectedProcessId?: number,
): AlignedCareerHistory {
  const ordered = processes.toSorted(compareAdmissionProcesses);
  const usesAdmittedScores =
    metric === "minimum_admitted_score" || metric === "average_score" || metric === "highest_score";
  const knownModalities = new Set(
    series.flatMap(({ items }) =>
      items.filter(hasSingleKnownScoreModality).map((item) => item.admitted_score_modality!),
    ),
  );
  const selectedRows =
    selectedProcessId === undefined
      ? []
      : series.map(({ items }) => items.find((item) => item.process.id === selectedProcessId));
  const selectedKnownModalities = new Set(
    selectedRows
      .filter((item): item is CareerComparisonRecord =>
        Boolean(item && hasSingleKnownScoreModality(item)),
      )
      .map((item) => item.admitted_score_modality!),
  );
  const selectedModality = !usesAdmittedScores
    ? null
    : selectedRows.length > 0 &&
        selectedRows.every((item): item is CareerComparisonRecord =>
          Boolean(item && hasSingleKnownScoreModality(item)),
        ) &&
        selectedKnownModalities.size === 1
      ? [...selectedKnownModalities][0]
      : knownModalities.size === 1
        ? [...knownModalities][0]
        : null;
  return {
    processes: ordered,
    series: series.map(({ id, label, items }) => {
      const byId = new Map(items.map((item) => [item.process.id, item]));
      return {
        id,
        label,
        values: ordered.map((process) => {
          const item = byId.get(process.id);
          if (
            usesAdmittedScores &&
            (!selectedModality || !item || item.admitted_score_modality !== selectedModality)
          )
            return null;
          return getCareerComparisonMetricValue(item, metric);
        }),
      };
    }),
  };
}

export type SharedHistoryInsight = {
  careerIds: Array<number | string>;
  careerNames: string[];
  uniqueMinimumCount: number;
  sharedProcessCount: number;
  period: string;
} | null;

/** Find unique per-process minima only when every selected series has data across at least two shared processes. */
export function getSharedHistoryMinimumInsight(
  aligned: AlignedCareerHistory,
): SharedHistoryInsight {
  const coverage = getSharedHistoryCoverage(aligned);
  if (!coverage.hasMinimumCoverage) return null;
  const sharedIndexes = aligned.processes
    .map((_, index) => index)
    .filter((index) => aligned.series.every((series) => series.values[index] !== null));
  const wins = aligned.series.map(() => 0);
  for (const index of sharedIndexes) {
    const values = aligned.series.map((series) => series.values[index]!);
    const minimum = Math.min(...values);
    const winners = values.flatMap((value, seriesIndex) =>
      value === minimum ? [seriesIndex] : [],
    );
    if (winners.length === 1) wins[winners[0]] += 1;
  }
  const maxWins = Math.max(...wins);
  if (maxWins === 0) return null;
  const winners = wins.flatMap((count, index) => (count === maxWins ? [index] : []));
  const period = `${processPeriodLabel(aligned.processes[sharedIndexes[0]])}–${processPeriodLabel(aligned.processes[sharedIndexes.at(-1)!])}`;
  return {
    careerIds: winners.map((index) => aligned.series[index].id),
    careerNames: winners.map((index) => aligned.series[index].label),
    uniqueMinimumCount: maxWins,
    sharedProcessCount: sharedIndexes.length,
    period,
  };
}

function processPeriodLabel(process: AdmissionProcess) {
  const sequence = process.sequence.includes("-")
    ? process.sequence.slice(process.sequence.lastIndexOf("-") + 1)
    : process.sequence;
  return `${process.year}-${sequence}`;
}
