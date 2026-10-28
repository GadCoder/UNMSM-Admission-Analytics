import { useId, useMemo, useState } from "react";

import type { ProcessMetrics } from "../api/analytics.types";
import {
  METRIC_OPTIONS,
  canCompareMinimumScores,
  getMetricValue,
  type MetricKey,
} from "./metricHistory";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import { MetricHistoryPlot } from "./MetricHistoryPlot";
import { AnalyticsSurface } from "./AnalyticsSurface";
import surfaceStyles from "./AnalyticsSurface.module.css";
import { SelectField } from "./SelectField";
import styles from "./MetricHistoryChart.module.css";

type MetricHistoryChartProps = {
  items: ProcessMetrics[];
  title: string;
  status?: "ready" | "loading" | "error";
  defaultMetric?: MetricKey;
  selectedProcessId?: number;
};

function getStatusMessage(status: MetricHistoryChartProps["status"], hasValues: boolean) {
  if (status === "loading")
    return (
      <p className={styles.metricHistoryEmpty} role="status">
        Cargando evolución histórica…
      </p>
    );
  if (status === "error")
    return (
      <p className={styles.metricHistoryEmpty} role="alert">
        No pudimos cargar la evolución histórica.
      </p>
    );
  if (!hasValues)
    return (
      <p className={styles.metricHistoryEmpty}>
        Aún no hay suficientes procesos publicados para mostrar una evolución histórica.
      </p>
    );
  return null;
}

function chronologicalValue(item: ProcessMetrics) {
  const sequence = (item.process.sequence.split("-").at(-1) ?? "0").trim().toUpperCase();
  const romanOrder: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
  const numericSequence = romanOrder[sequence] ?? Number(sequence);
  return item.process.year * 100 + (Number.isFinite(numericSequence) ? numericSequence : 0);
}

function processOrder(sequence: string) {
  const normalized = sequence.trim().toUpperCase();
  const suffix = normalized.slice(normalized.lastIndexOf("-") + 1);
  const romanOrder: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
  const numeric = romanOrder[suffix] ?? Number(suffix);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getMinimumScoreInsight(items: ProcessMetrics[], selectedProcessId?: number) {
  const selected = items.find((item) => item.process.id === selectedProcessId);
  const anchor = selected ?? items.findLast((item) => canCompareMinimumScores(item, item));
  if (!anchor || !canCompareMinimumScores(anchor, anchor)) return null;

  // Retain process positions: a missing or different modality breaks the series.
  const lastIndex = items.findLastIndex((item) => canCompareMinimumScores(anchor, item));
  const segment: ProcessMetrics[] = [];
  for (let index = lastIndex; index >= 0; index -= 1) {
    if (!canCompareMinimumScores(anchor, items[index])) break;
    segment.unshift(items[index]);
  }
  if (segment.length < 2) return null;

  const last = segment.at(-1)!;
  const prior = segment.at(-2)!;
  const changes = segment
    .slice(1)
    .map((item, index) => item.minimum_admitted_score! - segment[index].minimum_admitted_score!);
  const monotonic = changes.every((change) => change > 0) || changes.every((change) => change < 0);
  const first = monotonic ? segment[0] : prior;
  const difference = last.minimum_admitted_score! - first.minimum_admitted_score!;
  const period = `Entre ${formatProcessLabel(first.process)} y ${formatProcessLabel(last.process)}`;
  if (difference === 0) {
    return `${period}, el puntaje mínimo de ingreso se mantuvo en ${formatNumber(last.minimum_admitted_score!, 4)} puntos en esta modalidad.`;
  }
  const direction = difference > 0 ? "aumentó" : "disminuyó";
  const continuity =
    monotonic && segment.length > 2 ? ` a lo largo de ${segment.length} procesos consecutivos` : "";
  return `${period}, el puntaje mínimo de ingreso ${direction} ${formatNumber(Math.abs(difference), 2)} puntos${continuity} en esta modalidad.`;
}

function getInsight(items: ProcessMetrics[], metric: MetricKey) {
  const byYear = new Map<number, { order: number; value: number }[]>();
  for (const item of items) {
    const value = getMetricValue(item, metric);
    if (value === null) continue;
    const entries = byYear.get(item.process.year) ?? [];
    entries.push({ order: processOrder(item.process.sequence), value });
    byYear.set(item.process.year, entries);
  }

  const withinYearComparisons = [...byYear.entries()]
    .map(([year, entries]) => ({ year, entries: entries.sort((a, b) => a.order - b.order) }))
    .filter(({ entries }) => entries.length >= 2)
    .sort((a, b) => a.year - b.year)
    .map(({ year, entries }) => ({
      year,
      firstExceedsSecond: entries[0].value > entries[1].value,
    }));

  let repeatedPattern: { start: number; end: number; direction: boolean } | null = null;
  for (let start = 0; start < withinYearComparisons.length; start += 1) {
    let end = start + 1;
    while (
      end < withinYearComparisons.length &&
      withinYearComparisons[end].firstExceedsSecond ===
        withinYearComparisons[start].firstExceedsSecond
    )
      end += 1;
    if (end - start >= 2 && (!repeatedPattern || end > repeatedPattern.end)) {
      repeatedPattern = { start, end, direction: withinYearComparisons[start].firstExceedsSecond };
    }
  }

  if (repeatedPattern) {
    const years = withinYearComparisons
      .slice(repeatedPattern.start, repeatedPattern.end)
      .map(({ year }) => year)
      .join(" y ");
    const metricPhrase: Record<MetricKey, string> = {
      total_results: "la cantidad de postulantes",
      admitted_count: "la cantidad de ingresantes",
      admission_rate: "el porcentaje de ingreso",
      absent_count: "la cantidad de postulantes ausentes",
      average_score: "el puntaje promedio",
      highest_score: "el puntaje máximo",
      minimum_admitted_score: "el puntaje mínimo de ingreso",
    };
    const subject = repeatedPattern.direction ? "los primeros" : "los segundos";
    const comparator = repeatedPattern.direction ? "los segundos" : "los primeros";
    const reversal = withinYearComparisons[repeatedPattern.end];
    const reversalNote = reversal
      ? ` En ${reversal.year}, esta diferencia cambió de dirección.`
      : "";
    return `En ${years}, ${subject} procesos superaron a ${comparator} en ${metricPhrase[metric]}.${reversalNote}`;
  }

  const yearly = new Map<number, Map<string, number>>();
  for (const item of items) {
    const value = getMetricValue(item, metric);
    if (value === null) continue;
    const period = item.process.sequence.split("-").at(-1) ?? item.process.sequence;
    const periods = yearly.get(item.process.year) ?? new Map<string, number>();
    periods.set(period, value);
    yearly.set(item.process.year, periods);
  }

  const changes: number[] = [];
  const years = [...yearly.keys()].sort((a, b) => a - b);
  for (let index = 1; index < years.length; index += 1) {
    const previous = yearly.get(years[index - 1])!;
    const current = yearly.get(years[index])!;
    for (const [period, value] of current) {
      const priorValue = previous.get(period);
      if (priorValue !== undefined && priorValue !== 0)
        changes.push(((value - priorValue) / Math.abs(priorValue)) * 100);
    }
  }

  if (changes.length >= 2 && changes.every((change) => change > 0)) {
    return `El valor aumentó en los ${changes.length} procesos comparables más recientes entre años.`;
  }
  if (changes.length >= 2 && changes.every((change) => change < 0)) {
    return `El valor disminuyó en los ${changes.length} procesos comparables más recientes entre años.`;
  }

  const values = items
    .map((item) => getMetricValue(item, metric))
    .filter((value): value is number => value !== null);
  if (values.length >= 4) {
    const latest = values.at(-1)!;
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (
      latest === max &&
      max >
        values.slice(0, -1).reduce((currentMax, value) => Math.max(currentMax, value), -Infinity)
    ) {
      return "El último proceso alcanzó el valor más alto de la serie histórica.";
    }
    if (
      latest === min &&
      min < values.slice(0, -1).reduce((currentMin, value) => Math.min(currentMin, value), Infinity)
    ) {
      return "El último proceso registró el valor más bajo de la serie histórica.";
    }
  }
  return null;
}

export function MetricHistoryChart({
  items,
  title,
  status = "ready",
  defaultMetric = "total_results",
  selectedProcessId,
}: MetricHistoryChartProps) {
  const [metricChoice, setSelectedMetric] = useState<MetricKey | null>(null);
  const selectedMetric = metricChoice ?? defaultMetric;
  const [showLimitations, setShowLimitations] = useState(false);
  const limitationsId = useId();
  const metric =
    METRIC_OPTIONS.find((option) => option.key === selectedMetric) ?? METRIC_OPTIONS[0];
  const orderedItems = useMemo(
    () => [...items].sort((a, b) => chronologicalValue(a) - chronologicalValue(b)),
    [items],
  );
  const values = useMemo(
    () =>
      orderedItems.flatMap((item) => {
        const value = getMetricValue(item, selectedMetric);
        return value === null ? [] : [{ item, value }];
      }),
    [orderedItems, selectedMetric],
  );
  const statusMessage = getStatusMessage(status, values.length > 0);
  const insight =
    selectedMetric === "minimum_admitted_score"
      ? getMinimumScoreInsight(orderedItems, selectedProcessId)
      : getInsight(orderedItems, selectedMetric);

  return (
    <AnalyticsSurface className={styles.metricHistory} aria-label={title}>
      <div className={styles.metricHistoryContent}>
        <header className={styles.metricHistoryHeader}>
          <div className={styles.metricHistoryHeading}>
            <h2 className={surfaceStyles.sectionTitle}>{title}</h2>
            <p>{metric.label} por proceso de admisión</p>
          </div>
          <SelectField
            label="Métrica"
            aria-label="Métrica"
            value={selectedMetric}
            onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}
          >
            {METRIC_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </header>
        {selectedMetric === "minimum_admitted_score" && (
          <div className={styles.metricHistoryExplanation}>
            <p>
              Menor puntaje obtenido por un ingresante en cada proceso. Los resultados históricos no
              garantizan el ingreso futuro.
            </p>
            <div
              className={styles.metricHistoryHelp}
              onMouseEnter={() => setShowLimitations(true)}
              onMouseLeave={() => setShowLimitations(false)}
            >
              <button
                type="button"
                aria-label="Información sobre comparabilidad de puntajes"
                aria-describedby={showLimitations ? limitationsId : undefined}
                onFocus={() => setShowLimitations(true)}
                onBlur={() => setShowLimitations(false)}
                onClick={() => setShowLimitations(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setShowLimitations(false);
                }}
              >
                ⓘ
              </button>
              {showLimitations && (
                <span id={limitationsId} role="tooltip" className={styles.metricHistoryHelpTooltip}>
                  Las comparaciones usan mínimos válidos de una misma modalidad identificada. Los
                  procesos con modalidades mezcladas o sin datos se muestran como huecos. Las
                  escalas y reglas históricas no están documentadas; una modalidad común no confirma
                  que esas reglas sean iguales.
                </span>
              )}
            </div>
          </div>
        )}
        {statusMessage ?? (
          <>
            <MetricHistoryPlot
              items={orderedItems}
              metric={metric}
              selectedProcessId={selectedProcessId}
            />
            {insight && (
              <aside className={styles.metricHistoryInsight}>
                <strong>Patrón histórico</strong>
                <p>{insight}</p>
              </aside>
            )}
          </>
        )}
      </div>
    </AnalyticsSurface>
  );
}
