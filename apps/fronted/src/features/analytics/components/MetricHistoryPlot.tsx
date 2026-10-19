import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { ProcessMetrics } from "../api/analytics.types";
import { formatNumber, formatSignedDifference } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import type { MetricOption } from "./metricHistory";
import { formatMetricValue, getMetricValue } from "./metricHistory";
import styles from "./MetricHistoryChart.module.css";

type MetricHistoryPlotProps = { items: ProcessMetrics[]; metric: MetricOption };
type ChartPoint = { item: ProcessMetrics; value: number; index: number; x: number; y: number };
const chartHeight = 300;
const plotTop = 18;
const plotBottom = 248;

export function MetricHistoryPlot({ items, metric }: MetricHistoryPlotProps) {
  const [chartWidth, setChartWidth] = useState(600);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const chartHostRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    const container = chartHostRef.current;
    if (!container) return;
    const updateWidth = () => setChartWidth(Math.max(1, container.clientWidth || 600));
    updateWidth();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const values = useMemo(() => items.flatMap((item) => {
    const value = getMetricValue(item, metric.key);
    return value === null ? [] : [{ item, value }];
  }), [items, metric.key]);
  const minValue = values.length ? Math.min(...values.map(({ value }) => value)) : 0;
  const maxValue = values.length ? Math.max(...values.map(({ value }) => value)) : 1;
  const naturalRange = maxValue - minValue;
  const padding = naturalRange ? naturalRange * 0.18 : Math.max(Math.abs(maxValue) * 0.1, 1);
  const domainMin = minValue - padding;
  const domainMax = maxValue + padding;
  const left = 62;
  const right = Math.max(left + 1, chartWidth - 18);
  const points: ChartPoint[] = values.map(({ item, value }, index) => ({
    item,
    value,
    index,
    x: values.length === 1 ? (left + right) / 2 : left + (index / (values.length - 1)) * (right - left),
    y: plotBottom - ((value - domainMin) / (domainMax - domainMin)) * (plotBottom - plotTop),
  }));
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const average = values.length ? values.reduce((total, point) => total + point.value, 0) / values.length : null;
  const averageY = average === null ? plotBottom : plotBottom - ((average - domainMin) / (domainMax - domainMin)) * (plotBottom - plotTop);
  const ticks = Array.from({ length: 5 }, (_, index) => ({
    value: domainMax - ((domainMax - domainMin) * index) / 4,
    y: plotTop + ((plotBottom - plotTop) * index) / 4,
  }));

  const variationFor = (point: ChartPoint) => {
    const previous = points[point.index - 1];
    if (!previous) return "Primer proceso de la serie; sin proceso anterior para comparar.";
    const difference = point.value - previous.value;
    if (metric.key === "admission_rate") {
      return `Variación: ${formatSignedDifference(difference, metric.digits, " puntos porcentuales")} respecto a ${formatProcessLabel(previous.item.process)}.`;
    }
    if (previous.value === 0) {
      return `Variación: ${formatSignedDifference(difference, metric.digits)} respecto a ${formatProcessLabel(previous.item.process)}; el cambio porcentual no se calcula desde cero.`;
    }
    const percentDifference = (difference / Math.abs(previous.value)) * 100;
    return `Variación: ${formatSignedDifference(difference, metric.digits)} (${formatSignedDifference(percentDifference, 1, "%")}) respecto a ${formatProcessLabel(previous.item.process)}.`;
  };

  const pointDescription = (point: ChartPoint) => `${formatProcessLabel(point.item.process)}: ${formatMetricValue(point.value, metric)}. ${variationFor(point)}`;
  const activePoint = activePointIndex === null ? null : points[activePointIndex] ?? null;
  const tooltipLeft = activePoint ? Math.max(120, Math.min(chartWidth - 120, activePoint.x)) : 0;

  return (
    <div ref={chartHostRef} className={styles.metricHistoryPlot}>
      <svg className={styles.metricHistorySvg} viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`${metric.label} por proceso`}>
        {ticks.map((tick, index) => (
          <g key={index} aria-hidden="true">
            <line className={styles.metricHistoryGridLine} x1={left} y1={tick.y} x2={right} y2={tick.y} />
            <text className={styles.metricHistoryTick} x={left - 10} y={tick.y + 4}>{formatNumber(tick.value, metric.digits)}{metric.suffix ?? ""}</text>
          </g>
        ))}
        {average !== null && <line className={styles.metricHistoryAverageLine} x1={left} y1={averageY} x2={right} y2={averageY} />}
        {points.length > 1 && <polyline className={styles.metricHistoryLine} points={linePoints} />}
        {points.map((point) => (
          <g
            key={point.item.process.id}
            className={styles.metricHistoryPointTarget}
            tabIndex={0}
            role="button"
            aria-label={pointDescription(point)}
            aria-describedby={activePointIndex === point.index ? tooltipId : undefined}
            aria-pressed={activePointIndex === point.index}
            onFocus={() => setActivePointIndex(point.index)}
            onBlur={() => setActivePointIndex(null)}
            onMouseEnter={() => setActivePointIndex(point.index)}
            onMouseLeave={() => setActivePointIndex(null)}
            onClick={() => setActivePointIndex((current) => current === point.index ? null : point.index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActivePointIndex((current) => current === point.index ? null : point.index);
              }
              if (event.key === "Escape") setActivePointIndex(null);
            }}
          >
            <circle className={styles.metricHistoryTouchTarget} cx={point.x} cy={point.y} r="14" />
            <circle className={styles.metricHistoryPoint} cx={point.x} cy={point.y} r="5" />
            <text className={styles.metricHistoryPeriod} x={point.x} y="274">
              <tspan className={styles.metricHistoryPeriodFull}>{formatProcessLabel(point.item.process)}</tspan>
              <tspan className={styles.metricHistoryPeriodShort}>{formatProcessLabel(point.item.process).replace(/^(\d{2})\d{2}/, "$1")}</tspan>
            </text>
          </g>
        ))}
      </svg>
      {activePoint && (
        <div
          id={tooltipId}
          className={styles.metricHistoryTooltip}
          data-placement={activePoint.y < 115 ? "below" : "above"}
          role="tooltip"
          style={{ left: `${(tooltipLeft / chartWidth) * 100}%`, top: `${(activePoint.y / chartHeight) * 100}%` }}
        >
          <strong>{formatProcessLabel(activePoint.item.process)}</strong>
          <span>{metric.label}: <b>{formatMetricValue(activePoint.value, metric)}</b></span>
          <span>{variationFor(activePoint)}</span>
        </div>
      )}
      {average !== null && (
        <p className={styles.metricHistoryAverage}>
          <span className={styles.metricHistoryAverageSwatch} aria-hidden="true" />
          Promedio histórico: <strong>{formatNumber(average, Math.max(metric.digits, 1))}{metric.suffix ?? ""}</strong>
        </p>
      )}
    </div>
  );
}
