import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";
import { formatProcessLabel } from "../utils/processLabels";

type ComparisonChartProps = { overviews: ProcessOverview[] };

function percentage(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

function comparisonLabel(value: number | null, values: Array<number | null>) {
  if (value === null) return "—";
  const comparable = values.filter((item): item is number => item !== null);
  if (comparable.length < 2 || comparable.every((item) => item === comparable[0])) return "Igual";
  return value === Math.max(...comparable) ? "Mayor" : "Menor";
}

function scoreValue(value: string | null) {
  return value === null ? null : Number(value);
}

export function ProcessComparisonChart({ overviews }: ComparisonChartProps) {
  if (overviews.length < 2) return null;

  const rankedByAdmissionRate = [...overviews].sort(
    (left, right) => percentage(right.admitted_count, right.total_results) - percentage(left.admitted_count, left.total_results),
  );
  const bestAdmissionRate = rankedByAdmissionRate[0];
  const bestRate = percentage(bestAdmissionRate.admitted_count, bestAdmissionRate.total_results);
  const metricValues = {
    applicants: overviews.map((item) => item.total_results),
    admitted: overviews.map((item) => item.admitted_count),
    admissionRate: overviews.map((item) => percentage(item.admitted_count, item.total_results)),
    absent: overviews.map((item) => item.absent_count),
    average: overviews.map((item) => scoreValue(item.average_score)),
    highest: overviews.map((item) => scoreValue(item.highest_score)),
  };

  return (
    <section className={`${styles.card} ${styles.comparisonCard}`} aria-labelledby="comparison-chart-heading">
      <header className={styles.comparisonCardHeader}>
        <div>
          <span className={styles.sectionEyebrow}>Vista comparativa</span>
          <h2 id="comparison-chart-heading">Comparación de procesos</h2>
          <p className={styles.chartDescription}>Compara volumen, resultados y rendimiento entre procesos sin perder el contexto.</p>
        </div>
        <aside className={styles.comparisonInsight} aria-label="Lectura rápida de la comparación">
          <span>Mejor tasa de admisión</span>
          <strong>{formatProcessLabel(bestAdmissionRate.process)}</strong>
          <small>{formatNumber(bestRate, 1)}% de postulantes admitidos</small>
        </aside>
      </header>

      <div className={styles.processComparisonGrid} role="img" aria-label="Comparación de postulantes, admitidos y ausentes entre procesos">
        {overviews.map((overview, index) => {
          const admissionRate = percentage(overview.admitted_count, overview.total_results);
          const absenceRate = percentage(overview.absent_count, overview.total_results);
          return (
            <article className={styles.processComparisonCard} key={overview.process.id}>
              <header>
                <div>
                  <span className={styles.processComparisonRole}>{index === 0 ? "Proceso analizado" : "Proceso comparado"}</span>
                  <h3>{formatProcessLabel(overview.process)}</h3>
                </div>
                <span className={styles.processComparisonIndex}>{String(index + 1).padStart(2, "0")}</span>
              </header>
              <div className={styles.processTotalMetric}>
                <strong>{formatNumber(overview.total_results)}</strong>
                <span>postulantes</span>
              </div>
              <dl className={styles.processMetricList}>
                <div><dt>Postulantes</dt><dd>{formatNumber(overview.total_results)} <small className={styles.metricComparisonBadge}>{comparisonLabel(metricValues.applicants[index], metricValues.applicants)}</small></dd></div>
                <div><dt>Admitidos</dt><dd className={styles.metricPositive}>{formatNumber(overview.admitted_count)} <small className={styles.metricComparisonBadge}>{comparisonLabel(metricValues.admitted[index], metricValues.admitted)}</small></dd></div>
                <div><dt>Tasa de admisión</dt><dd className={styles.metricPositive}>{formatNumber(admissionRate, 1)}% <small className={styles.metricComparisonBadge}>{comparisonLabel(metricValues.admissionRate[index], metricValues.admissionRate)}</small></dd></div>
                <div><dt>Ausentes</dt><dd>{formatNumber(overview.absent_count)} <small>{formatNumber(absenceRate, 1)}%</small> <small className={styles.metricComparisonBadge}>{comparisonLabel(metricValues.absent[index], metricValues.absent)}</small></dd></div>
                <div><dt>Promedio</dt><dd>{overview.average_score === null ? "—" : formatNumber(Number(overview.average_score), 2)} <small className={styles.metricComparisonBadge}>{comparisonLabel(metricValues.average[index], metricValues.average)}</small></dd></div>
                <div><dt>Máximo</dt><dd>{overview.highest_score === null ? "—" : formatNumber(Number(overview.highest_score), 2)} <small className={styles.metricComparisonBadge}>{comparisonLabel(metricValues.highest[index], metricValues.highest)}</small></dd></div>
              </dl>
            </article>
          );
        })}
      </div>

      <ul className={styles.visuallyHidden} aria-label="Datos de comparación">
        {overviews.map((overview) => <li key={overview.process.id}>{formatProcessLabel(overview.process)}: {formatNumber(overview.total_results)} postulantes, {formatNumber(overview.admitted_count)} admitidos, {formatNumber(overview.absent_count)} ausentes.</li>)}
      </ul>
      <p className={styles.comparisonFootnote}>La tasa de admisión muestra qué proporción de postulantes terminó admitida; es más útil para comparar procesos de distinto tamaño que el conteo absoluto.</p>
    </section>
  );
}
