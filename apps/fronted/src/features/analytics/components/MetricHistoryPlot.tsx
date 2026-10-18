import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { ProcessMetrics } from "../api/analytics.types";
import { formatNumber, formatSignedDifference } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import type { MetricOption } from "./metricHistory";
import { formatMetricValue, getMetricValue } from "./metricHistory";
import styles from "./MetricHistoryChart.module.css";

type MetricHistoryPlotProps = {
  items: ProcessMetrics[];
  metric: MetricOption;
};

type ChartPoint = {
  item: ProcessMetrics;
  value: number;
  sourceIndex: number;
  x: number;
  y: number;
};

export function MetricHistoryPlot({ items, metric }: MetricHistoryPlotProps) {
  const [chartWidth, setChartWidth] = useState(640);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const chartHostRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

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

  const chartPoints = useMemo<ChartPoint[]>(() => {
    const values = items
      .map((item, sourceIndex) => ({ item, sourceIndex, value: getMetricValue(item, metric.key) }))
      .filter((point): point is { item: ProcessMetrics; sourceIndex: number; value: number } => point.value !== null);
    if (values.length === 0) return [];

    const min = Math.min(...values.map((point) => point.value));
    const max = Math.max(...values.map((point) => point.value));
    const range = max - min || Math.max(Math.abs(max) * 0.1, 1);
    const left = 36;
    const right = chartWidth - 36;
    const top = 34;
    const bottom = 174;

    return values.map(({ item, sourceIndex, value }, index) => ({
      item,
      value,
      sourceIndex,
      x: values.length === 1 ? (left + right) / 2 : left + (index / (values.length - 1)) * (right - left),
      y: bottom - ((value - min) / range) * (bottom - top),
    }));
  }, [chartWidth, items, metric.key]);

  const linePoints = chartPoints.map(({ x, y }) => `${x},${y}`).join(" ");
  const average = chartPoints.length
    ? chartPoints.reduce((total, point) => total + point.value, 0) / chartPoints.length
    : null;
  const formattedAverage = average === null
    ? null
    : `${formatNumber(average, Math.max(metric.digits, 1))}${metric.suffix ?? ""}`;
  const min = chartPoints.length ? Math.min(...chartPoints.map((point) => point.value)) : 0;
  const max = chartPoints.length ? Math.max(...chartPoints.map((point) => point.value)) : 0;
  const range = max - min || Math.max(Math.abs(max) * 0.1, 1);
  const averageY = 174 - ((average === null ? 0 : average - min) / range) * (174 - 34);

  const variationFor = (point: ChartPoint) => {
    if (point.sourceIndex === 0) return "Primer proceso de la serie; sin proceso anterior para comparar.";
    const previousItem = items[point.sourceIndex - 1];
    const previousValue = getMetricValue(previousItem, metric.key);
    if (previousValue === null) {
      return `Sin dato de ${metric.label.toLocaleLowerCase("es-PE")} en ${formatProcessLabel(previousItem.process)}, el proceso anterior.`;
    }

    const difference = point.value - previousValue;
    if (metric.key === "admission_rate") {
      return `Variación: ${formatSignedDifference(difference, metric.digits, " puntos porcentuales")} respecto a ${formatProcessLabel(previousItem.process)}.`;
    }
    if (previousValue === 0) {
      return `Variación: ${formatSignedDifference(difference, metric.digits)} respecto a ${formatProcessLabel(previousItem.process)}; el cambio porcentual no se calcula desde cero.`;
    }

    const percentDifference = (difference / Math.abs(previousValue)) * 100;
    return `Variación: ${formatSignedDifference(difference, metric.digits)} (${formatSignedDifference(percentDifference, 1, "%")}) respecto a ${formatProcessLabel(previousItem.process)}.`;
  };

  const pointDescription = (point: ChartPoint) => `${formatProcessLabel(point.item.process)}: ${formatMetricValue(point.value, metric)}. ${variationFor(point)}`;

  return (
    <div ref={chartHostRef} className={styles.metricHistoryPlot}>
      <svg
        className={styles.metricHistorySvg}
        viewBox={`0 0 ${chartWidth} 220`}
        role="img"
        aria-label={`${metric.label} por proceso`}
      >
        <line x1="36" y1="174" x2={chartWidth - 36} y2="174" stroke="currentColor" opacity=".18" />
        {average !== null && <line className={styles.metricHistoryAverageLine} x1="36" y1={averageY} x2={chartWidth - 36} y2={averageY} />}
        {chartPoints.length > 1 && <polyline className={styles.metricHistoryLine} points={linePoints} />}
        {chartPoints.map((point, index) => (
          <g
            key={point.item.process.id}
            className={styles.metricHistoryPointTarget}
            tabIndex={0}
            role="group"
            aria-label={pointDescription(point)}
            aria-describedby={activePointIndex === index ? tooltipId : undefined}
            onFocus={() => setActivePointIndex(index)}
            onBlur={() => setActivePointIndex(null)}
            onMouseEnter={() => setActivePointIndex(index)}
            onMouseLeave={() => setActivePointIndex(null)}
          >
            <circle className={styles.metricHistoryPoint} cx={point.x} cy={point.y} r="5" />
            <text className={styles.metricHistoryValue} x={point.x} y={point.y - 12}>{formatMetricValue(point.value, metric)}</text>
            <text className={styles.metricHistoryPeriod} x={point.x} y="202">{formatProcessLabel(point.item.process)}</text>
          </g>
        ))}
      </svg>
      {activePointIndex !== null && chartPoints[activePointIndex] && (
        <div
          id={tooltipId}
          className={styles.metricHistoryTooltip}
          data-placement={chartPoints[activePointIndex].y < 82 ? "below" : "above"}
          role="tooltip"
          style={{
            left: `${Math.max(96, Math.min(chartWidth - 96, chartPoints[activePointIndex].x)) / chartWidth * 100}%`,
            top: `${chartPoints[activePointIndex].y / 220 * 100}%`,
          }}
        >
          <strong>{formatProcessLabel(chartPoints[activePointIndex].item.process)}</strong>
          <span>{metric.label}: <b>{formatMetricValue(chartPoints[activePointIndex].value, metric)}</b></span>
          <span>{variationFor(chartPoints[activePointIndex])}</span>
        </div>
      )}
      {average !== null && (
        <p className={styles.metricHistoryAverage}>
          <span className={styles.metricHistoryAverageSwatch} aria-hidden="true" />
          Promedio histórico: <strong>{formattedAverage}</strong>
        </p>
      )}
    </div>
  );
}
