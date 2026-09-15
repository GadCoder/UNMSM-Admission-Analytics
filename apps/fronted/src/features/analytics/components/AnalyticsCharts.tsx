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

function comparisonClass(value: number | null, values: Array<number | null>) {
  return comparisonLabel(value, values) === "Mayor" ? styles.metricWinner : "";
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

      <p className={styles.comparisonLegend}><span className={styles.metricWinnerSwatch} aria-hidden="true" /> Mayor valor en cada métrica</p>
      <div className={styles.processComparisonGrid} role="img" aria-label="Comparación de postulantes, admitidos y ausentes entre procesos">
        {overviews.map((overview, index) => {
          const admissionRate = percentage(overview.admitted_count, overview.total_results);
          const absenceRate = percentage(overview.absent_count, overview.total_results);
          return (
            <article className={styles.processComparisonCard} key={overview.process.id}>
              <header>
                <div>
                  <h3>{formatProcessLabel(overview.process)}</h3>
                </div>
              </header>
              <div className={styles.processTotalMetric}>
                <strong className={comparisonClass(metricValues.applicants[index], metricValues.applicants)} title={comparisonLabel(metricValues.applicants[index], metricValues.applicants)}>{formatNumber(overview.total_results)}</strong>
                <span>postulantes</span>
              </div>
              <dl className={styles.processMetricList}>
                <div><dt>Admitidos</dt><dd className={comparisonClass(metricValues.admitted[index], metricValues.admitted)} title={comparisonLabel(metricValues.admitted[index], metricValues.admitted)}>{formatNumber(overview.admitted_count)}</dd></div>
                <div><dt>Tasa de admisión</dt><dd className={comparisonClass(metricValues.admissionRate[index], metricValues.admissionRate)} title={comparisonLabel(metricValues.admissionRate[index], metricValues.admissionRate)}>{formatNumber(admissionRate, 1)}%</dd></div>
                <div><dt>Ausentes</dt><dd className={comparisonClass(metricValues.absent[index], metricValues.absent)} title={comparisonLabel(metricValues.absent[index], metricValues.absent)}><span>{formatNumber(overview.absent_count)}</span><small className={styles.metricSecondary}>{formatNumber(absenceRate, 1)}% del total</small></dd></div>
                <div><dt>Promedio</dt><dd className={comparisonClass(metricValues.average[index], metricValues.average)} title={comparisonLabel(metricValues.average[index], metricValues.average)}>{overview.average_score === null ? "—" : formatNumber(Number(overview.average_score), 2)}</dd></div>
                <div><dt>Máximo</dt><dd className={comparisonClass(metricValues.highest[index], metricValues.highest)} title={comparisonLabel(metricValues.highest[index], metricValues.highest)}>{overview.highest_score === null ? "—" : formatNumber(Number(overview.highest_score), 2)}</dd></div>
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
