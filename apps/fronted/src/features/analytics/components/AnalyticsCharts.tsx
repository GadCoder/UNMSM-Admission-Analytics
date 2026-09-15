import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { ProcessComparisonCard } from "./ProcessComparisonCard";
import { buildComparisonMetricValues } from "./comparisonMetrics";

type ComparisonChartProps = { overviews: ProcessOverview[] };

export function ProcessComparisonChart({ overviews }: ComparisonChartProps) {
  if (overviews.length < 2) return null;

  const metricValues = buildComparisonMetricValues(overviews);

  return (
    <section className={`${styles.card} ${styles.comparisonCard}`} aria-labelledby="comparison-chart-heading">
      <header className={styles.comparisonCardHeader}>
        <div>
          <span className={styles.sectionEyebrow}>Vista comparativa</span>
          <h2 id="comparison-chart-heading">Comparación de procesos</h2>
          <p className={styles.chartDescription}>Compara volumen, resultados y rendimiento entre procesos sin perder el contexto.</p>
        </div>
      </header>

      <p className={styles.comparisonLegend}><span className={styles.metricWinnerSwatch} aria-hidden="true" /> Mayor valor en cada métrica</p>
      <div className={styles.processComparisonGrid} role="img" aria-label="Comparación de postulantes, admitidos y ausentes entre procesos">
        {overviews.map((overview, index) => (
          <ProcessComparisonCard
            key={overview.process.id}
            overview={overview}
            index={index}
            metricValues={metricValues}
          />
        ))}
      </div>

      <ul className={styles.visuallyHidden} aria-label="Datos de comparación">
        {overviews.map((overview) => (
          <li key={overview.process.id}>
            {formatProcessLabel(overview.process)}: {formatNumber(overview.total_results)} postulantes, {formatNumber(overview.admitted_count)} admitidos, {formatNumber(overview.absent_count)} ausentes.
          </li>
        ))}
      </ul>
    </section>
  );
}
