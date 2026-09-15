import { useId, useState } from "react";

import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { percentage } from "./comparisonMetrics";

type KpiEvolutionProps = { overviews: ProcessOverview[] };
type MetricKey = "applicants" | "entrants" | "admissionRate" | "absentRate" | "average" | "highest";
type MetricDefinition = { label: string; unit: "count" | "percent" | "points"; getValue: (overview: ProcessOverview) => number | null };

const metrics: Record<MetricKey, MetricDefinition> = {
  applicants: { label: "Postulantes", unit: "count", getValue: (overview) => overview.total_results },
  entrants: { label: "Ingresantes", unit: "count", getValue: (overview) => overview.admitted_count },
  admissionRate: { label: "% de ingresantes", unit: "percent", getValue: (overview) => percentage(overview.admitted_count, overview.total_results) },
  absentRate: { label: "% de ausentes", unit: "percent", getValue: (overview) => percentage(overview.absent_count, overview.total_results) },
  average: { label: "Puntaje promedio", unit: "points", getValue: (overview) => overview.average_score === null ? null : Number(overview.average_score) },
  highest: { label: "Puntaje máximo", unit: "points", getValue: (overview) => overview.highest_score === null ? null : Number(overview.highest_score) },
};

const chart = { width: 720, height: 290, left: 58, right: 28, top: 30, bottom: 58 };

export function KpiEvolution({ overviews }: KpiEvolutionProps) {
  const [metricKey, setMetricKey] = useState<MetricKey>("applicants");
  const titleId = useId();
  const definition = metrics[metricKey];
  const values = overviews.map(definition.getValue);
  const numericValues = values.filter((value): value is number => value !== null && value >= 0);
  const max = numericValues.length ? Math.max(...numericValues) : 1;
  const scaleMax = max || 1;
  const baseline = chart.height - chart.bottom;
  const usableWidth = chart.width - chart.left - chart.right;
  const slotWidth = overviews.length ? usableWidth / overviews.length : usableWidth;
  const barWidth = Math.min(86, slotWidth * 0.56);
  const formatValue = (value: number | null) => value === null ? "Sin dato" : formatNumber(value, definition.unit === "count" ? 0 : 2) + (definition.unit === "percent" ? "%" : definition.unit === "points" ? " pts" : "");
  const formatAxisValue = (value: number) => definition.unit === "count" ? formatNumber(value, 0) : `${formatNumber(value, 1)}${definition.unit === "percent" ? "%" : " pts"}`;
  const chartDescription = `${definition.label} por proceso: ${overviews.map((overview, index) => `${formatProcessLabel(overview.process)}, ${formatValue(values[index])}`).join("; ")}.`;

  return (
    <section className={`${styles.card} ${styles.evolutionCard}`} aria-labelledby={titleId}>
      <header className={styles.evolutionHeader}>
        <div>
          <h2 id={titleId}>Comparación por procesos</h2>
          <p>Selecciona una métrica para comparar sus valores entre procesos.</p>
        </div>
        <label className={styles.evolutionSelect}>
          <span>Métrica</span>
          <select value={metricKey} onChange={(event) => setMetricKey(event.target.value as MetricKey)}>
            {Object.entries(metrics).map(([key, metric]) => <option key={key} value={key}>{metric.label}</option>)}
          </select>
        </label>
      </header>

      <div className={styles.evolutionChartWrap}>
        <svg className={styles.evolutionChart} viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-labelledby={`${titleId}-description`}>
          <title id={`${titleId}-description`}>{chartDescription}</title>
          {[0, 0.5, 1].map((fraction) => {
            const y = baseline - fraction * (baseline - chart.top);
            return <g key={fraction}><line x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} className={styles.evolutionGridLine} /><text x={chart.left - 10} y={y + 4} textAnchor="end" className={styles.evolutionAxisLabel}>{formatAxisValue(scaleMax * fraction)}</text></g>;
          })}
          {values.map((value, index) => {
            const centerX = chart.left + slotWidth * (index + 0.5);
            const height = value === null || value < 0 ? 0 : (value / scaleMax) * (baseline - chart.top);
            const x = centerX - barWidth / 2;
            const y = baseline - height;
            return <g key={overviews[index].process.id}><rect x={x} y={y} width={barWidth} height={height} rx="6" className={styles.evolutionBar} /><text x={centerX} y={value === null ? baseline - 10 : y - 10} textAnchor="middle" className={styles.evolutionValueLabel}>{formatValue(value)}</text><text x={centerX} y={chart.height - 26} textAnchor="middle" className={styles.evolutionProcessLabel}>{formatProcessLabel(overviews[index].process)}</text></g>;
          })}
        </svg>
      </div>
    </section>
  );
}
