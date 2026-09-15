import type { ProcessOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { buildComparisonMetricValues } from "./comparisonMetrics";
import { ProcessComparisonTable } from "./ProcessComparisonTable";

type ComparisonChartProps = { overviews: ProcessOverview[] };

export function ProcessComparisonChart({ overviews }: ComparisonChartProps) {
  if (overviews.length < 2) return null;

  const metricValues = buildComparisonMetricValues(overviews);

  return (
    <section className={`${styles.card} ${styles.comparisonCard}`} aria-labelledby="comparison-chart-heading">
      <header className={styles.comparisonCardHeader}>
        <h2 id="comparison-chart-heading" className={styles.comparisonSectionTitle}>Vista comparativa</h2>
      </header>

      <p className={styles.comparisonLegend}><span className={styles.metricWinnerSwatch} aria-hidden="true" /> Mayor valor en cada métrica</p>
      <ProcessComparisonTable overviews={overviews} metricValues={metricValues} />
    </section>
  );
}
