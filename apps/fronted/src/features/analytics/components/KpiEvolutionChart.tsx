import type { ProcessOverview } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { formatMetricAxisValue, formatMetricValue, type MetricDefinition } from "./kpiEvolutionMetrics";

type KpiEvolutionChartProps = {
  overviews: ProcessOverview[];
  metric: MetricDefinition;
  titleId: string;
};

const chart = { width: 720, height: 290, left: 58, right: 28, top: 30, bottom: 58 };

export function KpiEvolutionChart({ overviews, metric, titleId }: KpiEvolutionChartProps) {
  const values = overviews.map(metric.getValue);
  const numericValues = values.filter((value): value is number => value !== null && value >= 0);
  const scaleMax = numericValues.length ? Math.max(...numericValues) || 1 : 1;
  const baseline = chart.height - chart.bottom;
  const usableWidth = chart.width - chart.left - chart.right;
  const slotWidth = overviews.length ? usableWidth / overviews.length : usableWidth;
  const barWidth = Math.min(86, slotWidth * 0.56);
  const chartDescription = `${metric.label} por proceso: ${overviews.map((overview, index) => `${formatProcessLabel(overview.process)}, ${formatMetricValue(values[index], metric)}`).join("; ")}.`;

  return (
    <div className={styles.evolutionChartWrap}>
      <svg className={styles.evolutionChart} viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-labelledby={`${titleId}-description`}>
        <title id={`${titleId}-description`}>{chartDescription}</title>
        {[0, 0.5, 1].map((fraction) => {
          const y = baseline - fraction * (baseline - chart.top);
          return <g key={fraction}><line x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} className={styles.evolutionGridLine} /><text x={chart.left - 10} y={y + 4} textAnchor="end" className={styles.evolutionAxisLabel}>{formatMetricAxisValue(scaleMax * fraction, metric)}</text></g>;
        })}
        {values.map((value, index) => {
          const centerX = chart.left + slotWidth * (index + 0.5);
          const height = value === null || value < 0 ? 0 : (value / scaleMax) * (baseline - chart.top);
          const x = centerX - barWidth / 2;
          const y = baseline - height;
          return <g key={overviews[index].process.id}><rect x={x} y={y} width={barWidth} height={height} rx="6" className={styles.evolutionBar} /><text x={centerX} y={value === null ? baseline - 10 : y - 10} textAnchor="middle" className={styles.evolutionValueLabel}>{formatMetricValue(value, metric)}</text><text x={centerX} y={chart.height - 26} textAnchor="middle" className={styles.evolutionProcessLabel}>{formatProcessLabel(overviews[index].process)}</text></g>;
        })}
      </svg>
    </div>
  );
}
