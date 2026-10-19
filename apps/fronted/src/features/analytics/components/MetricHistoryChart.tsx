import { useMemo, useState } from "react";

import type { ProcessMetrics } from "../api/analytics.types";
import { METRIC_OPTIONS, getMetricValue, type MetricKey } from "./metricHistory";
import { MetricHistoryPlot } from "./MetricHistoryPlot";
import { AnalyticsSurface } from "./AnalyticsSurface";
import { SelectField } from "./SelectField";
import styles from "./MetricHistoryChart.module.css";

type MetricHistoryChartProps = {
  items: ProcessMetrics[];
  title: string;
  status?: "ready" | "loading" | "error";
};

function getStatusMessage(status: MetricHistoryChartProps["status"], hasValues: boolean) {
  if (status === "loading") return <p className={styles.metricHistoryEmpty} role="status">Cargando evolución histórica…</p>;
  if (status === "error") return <p className={styles.metricHistoryEmpty} role="alert">No pudimos cargar la evolución histórica.</p>;
  if (!hasValues) return <p className={styles.metricHistoryEmpty}>Aún no hay suficientes procesos publicados para mostrar una evolución histórica.</p>;
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
    .map(({ year, entries }) => ({ year, firstExceedsSecond: entries[0].value > entries[1].value }));

  let repeatedPattern: { start: number; end: number; direction: boolean } | null = null;
  for (let start = 0; start < withinYearComparisons.length; start += 1) {
    let end = start + 1;
    while (end < withinYearComparisons.length
      && withinYearComparisons[end].firstExceedsSecond === withinYearComparisons[start].firstExceedsSecond) end += 1;
    if (end - start >= 2 && (!repeatedPattern || end > repeatedPattern.end)) {
      repeatedPattern = { start, end, direction: withinYearComparisons[start].firstExceedsSecond };
    }
  }

  if (repeatedPattern) {
    const years = withinYearComparisons.slice(repeatedPattern.start, repeatedPattern.end).map(({ year }) => year).join(" y ");
    const metricPhrase: Record<MetricKey, string> = {
      total_results: "la cantidad de postulantes",
      admitted_count: "la cantidad de ingresantes",
      admission_rate: "el porcentaje de ingreso",
      absent_count: "la cantidad de postulantes ausentes",
      average_score: "el puntaje promedio",
      highest_score: "el puntaje máximo",
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
      if (priorValue !== undefined && priorValue !== 0) changes.push(((value - priorValue) / Math.abs(priorValue)) * 100);
    }
  }

  if (changes.length >= 2 && changes.every((change) => change > 0)) {
    return `El valor aumentó en los ${changes.length} procesos comparables más recientes entre años.`;
  }
  if (changes.length >= 2 && changes.every((change) => change < 0)) {
    return `El valor disminuyó en los ${changes.length} procesos comparables más recientes entre años.`;
  }

  const values = items.map((item) => getMetricValue(item, metric)).filter((value): value is number => value !== null);
  if (values.length >= 4) {
    const latest = values.at(-1)!;
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (latest === max && max > values.slice(0, -1).reduce((currentMax, value) => Math.max(currentMax, value), -Infinity)) {
      return "El último proceso alcanzó el valor más alto de la serie histórica.";
    }
    if (latest === min && min < values.slice(0, -1).reduce((currentMin, value) => Math.min(currentMin, value), Infinity)) {
      return "El último proceso registró el valor más bajo de la serie histórica.";
    }
  }
  return null;
}

export function MetricHistoryChart({ items, title, status = "ready" }: MetricHistoryChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("total_results");
  const metric = METRIC_OPTIONS.find((option) => option.key === selectedMetric) ?? METRIC_OPTIONS[0];
  const orderedItems = useMemo(() => [...items].sort((a, b) => chronologicalValue(a) - chronologicalValue(b)), [items]);
  const values = useMemo(() => orderedItems.flatMap((item) => {
    const value = getMetricValue(item, selectedMetric);
    return value === null ? [] : [{ item, value }];
  }), [orderedItems, selectedMetric]);
  const statusMessage = getStatusMessage(status, values.length > 0);
  const insight = getInsight(orderedItems, selectedMetric);

  return (
    <AnalyticsSurface className={styles.metricHistory} aria-label={title}>
      <div className={styles.metricHistoryContent}>
        <header className={styles.metricHistoryHeader}>
          <div className={styles.metricHistoryHeading}>
            <h2>{title}</h2>
            <p>{metric.label} por proceso de admisión</p>
          </div>
          <SelectField label="Métrica" value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}>
            {METRIC_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
          </SelectField>
        </header>
        {statusMessage ?? (
          <>
            <MetricHistoryPlot items={orderedItems} metric={metric} />
            {insight && <aside className={styles.metricHistoryInsight}><strong>Patrón histórico</strong><p>{insight}</p></aside>}
          </>
        )}
      </div>
    </AnalyticsSurface>
  );
}
