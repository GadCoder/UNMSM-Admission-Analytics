import { useEffect, useMemo, useRef, useState } from "react";

import type { ProcessMetrics } from "../api/analytics.types";
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
  x: number;
  y: number;
};

export function MetricHistoryPlot({ items, metric }: MetricHistoryPlotProps) {
  const [chartWidth, setChartWidth] = useState(640);
  const chartHostRef = useRef<HTMLDivElement>(null);

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
      .map((item) => ({ item, value: getMetricValue(item, metric.key) }))
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
  }, [chartWidth, items, metric.key]);

  const linePoints = chartPoints.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <div ref={chartHostRef} className={styles.metricHistoryPlot}>
      <svg
        className={styles.metricHistorySvg}
        viewBox={`0 0 ${chartWidth} 220`}
        role="img"
        aria-label={`${metric.label} por proceso`}
      >
        <line x1="36" y1="174" x2={chartWidth - 36} y2="174" stroke="currentColor" opacity=".18" />
        {chartPoints.length > 1 && <polyline className={styles.metricHistoryLine} points={linePoints} />}
        {chartPoints.map(({ item, value, x, y }) => (
          <g key={item.process.id}>
            <circle className={styles.metricHistoryPoint} cx={x} cy={y} r="5" />
            <text className={styles.metricHistoryValue} x={x} y={y - 12}>{formatMetricValue(value, metric)}</text>
            <text className={styles.metricHistoryPeriod} x={x} y="202">{formatProcessLabel(item.process)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
