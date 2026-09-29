import type { ProcessOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { buildComparisonMetricValues } from "./comparisonMetrics";
import { ProcessComparisonInsights } from "./ProcessComparisonInsights";
import { ProcessComparisonTable } from "./ProcessComparisonTable";
type ComparisonChartProps = { overviews: ProcessOverview[] };

export function ProcessComparisonChart({ overviews }: ComparisonChartProps) {
  if (overviews.length < 2) return null;

  const metricValues = buildComparisonMetricValues(overviews);

  return (
    <section className={styles.comparisonStack} aria-label="Comparación de procesos">
      <section className={`${styles.card} ${styles.comparisonCard}`} aria-labelledby="comparison-chart-heading">
        <header className={styles.comparisonCardHeader}>
          <div><p className={styles.sectionEyebrow}>Detalle de la comparación</p><h2 id="comparison-chart-heading" className={styles.comparisonSectionTitle}>Valores por proceso</h2></div>
        </header>
        <p className={styles.comparisonLegend}><span className={styles.metricWinnerSwatch} aria-hidden="true" /> Máximo y mínimo del período seleccionado</p>
        <ProcessComparisonTable overviews={overviews} metricValues={metricValues} />
      </section>
      <ProcessComparisonInsights overviews={overviews} />
    </section>
  );
}
