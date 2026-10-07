import { useEffect, useMemo, useRef, useState } from "react";

import type { ProcessMetrics } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "./MetricHistoryChart.module.css";

type MetricKey = "total_results" | "admitted_count" | "admission_rate" | "absent_count" | "average_score" | "highest_score";
type MetricOption = { key: MetricKey; label: string; digits: number; suffix?: string };

const metrics: MetricOption[] = [
  { key: "total_results", label: "Postulantes", digits: 0 },
  { key: "admitted_count", label: "Ingresantes", digits: 0 },
  { key: "admission_rate", label: "Porcentaje de ingresantes", digits: 1, suffix: "%" },
  { key: "absent_count", label: "Postulantes ausentes", digits: 0 },
  { key: "average_score", label: "Puntaje promedio", digits: 2 },
  { key: "highest_score", label: "Puntaje máximo", digits: 2 },
];

function metricValue(item: ProcessMetrics, metric: MetricKey): number | null {
  if (metric === "admission_rate") return item.total_results > 0 ? (item.admitted_count / item.total_results) * 100 : null;
  if (metric === "total_results") return item.total_results;
  if (metric === "admitted_count") return item.admitted_count;
  if (metric === "absent_count") return item.absent_count;
  const value = metric === "average_score" ? item.average_score : item.highest_score;
  return value === null ? null : Number(value);
}

function formatMetricValue(value: number, metric: MetricOption) {
  return `${formatNumber(value, metric.digits)}${metric.suffix ?? ""}`;
}

export function MetricHistoryChart({ items, title, status = "ready" }: { items: ProcessMetrics[]; title: string; status?: "ready" | "loading" | "error" }) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("total_results");
  const [chartWidth, setChartWidth] = useState(640);
  const chartHostRef = useRef<HTMLDivElement>(null);
  const metric = metrics.find((option) => option.key === selectedMetric) ?? metrics[0];

  useEffect(() => {
    const container = chartHostRef.current;
    if (!container) return;
    const updateWidth = () => setChartWidth(Math.max(280, container.clientWidth || 640));
    updateWidth();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const chartPoints = useMemo(() => {
    const values = items.map((item) => ({ item, value: metricValue(item, selectedMetric) }))
      .filter((point): point is { item: ProcessMetrics; value: number } => point.value !== null);
    if (values.length === 0) return [];
    const min = Math.min(...values.map((point) => point.value));
    const max = Math.max(...values.map((point) => point.value));
    const range = max - min || Math.max(Math.abs(max) * 0.1, 1);
    const left = 36;
    const right = chartWidth - 36;
    const top = 34;
    const bottom = 174;
    return values.map(({ item, value }, index) => ({
      item,
      value,
      x: values.length === 1 ? (left + right) / 2 : left + (index / (values.length - 1)) * (right - left),
      y: bottom - ((value - min) / range) * (bottom - top),
    }));
  }, [chartWidth, items, selectedMetric]);
  const linePoints = chartPoints.map(({ x, y }) => `${x},${y}`).join(" ");

  return <section className={`${styles.card} ${styles.metricHistory}`} aria-label={title}>
    <header className={styles.metricHistoryHeader}>
      <h2>{title}</h2>
      <label>Métrica
        <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}>
          {metrics.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </label>
    </header>
    {status === "loading" ? <p className={styles.metricHistoryEmpty} role="status">Cargando evolución histórica…</p>
      : status === "error" ? <p className={styles.metricHistoryEmpty} role="alert">No pudimos cargar la evolución histórica.</p>
        : chartPoints.length === 0 ? <p className={styles.metricHistoryEmpty}>Aún no hay suficientes procesos publicados para mostrar una evolución histórica.</p> : <>
          <div ref={chartHostRef} className={styles.metricHistoryPlot}>
            <svg className={styles.metricHistorySvg} viewBox={`0 0 ${chartWidth} 220`} role="img" aria-label={`${metric.label} por proceso`}>
              <line x1="36" y1="174" x2={chartWidth - 36} y2="174" stroke="currentColor" opacity=".18" />
              {chartPoints.length > 1 && <polyline className={styles.metricHistoryLine} points={linePoints} />}
              {chartPoints.map(({ item, value, x, y }) => <g key={item.process.id}>
                <circle className={styles.metricHistoryPoint} cx={x} cy={y} r="5" />
                <text className={styles.metricHistoryValue} x={x} y={y - 12}>{formatMetricValue(value, metric)}</text>
                <text className={styles.metricHistoryPeriod} x={x} y="202">{formatProcessLabel(item.process)}</text>
              </g>)}
            </svg>
          </div>
          <p className={styles.metricHistoryCurrent}>Mostrando {metric.label.toLocaleLowerCase("es-PE")} a través de los procesos publicados.</p>
        </>}
  </section>;
}
