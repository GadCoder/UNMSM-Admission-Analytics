import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

type ComparisonChartProps = { overviews: ProcessOverview[] };
type ChartBarProps = { label: string; value: number; max: number; color: string };

function ChartBar({ label, value, max, color }: ChartBarProps) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return <div className={styles.chartRow}><span className={styles.chartLabel}>{label}</span><div className={styles.chartTrack} aria-hidden="true"><span className={styles.chartBar} style={{ width: `${width}%`, backgroundColor: color }} /></div><strong>{formatNumber(value)}</strong></div>;
}

export function ProcessComparisonChart({ overviews }: ComparisonChartProps) {
  if (overviews.length < 2) return null;
  const max = Math.max(...overviews.map(({ total_results }) => total_results), 0);
  return <section className={styles.card} aria-labelledby="comparison-chart-heading">
    <h2 id="comparison-chart-heading">Comparación de procesos</h2>
    <p className={styles.chartDescription}>Postulantes, admitidos y ausentes por proceso. Las cifras exactas también se muestran debajo del gráfico.</p>
    <div className={styles.chart} role="img" aria-label="Comparación de postulantes, admitidos y ausentes entre procesos">
      {overviews.map((overview) => <div className={styles.processGroup} key={overview.process.id}><h3>{overview.process.name}</h3><ChartBar label="Postulantes" value={overview.total_results} max={max} color="var(--color-primary)" /><ChartBar label="Admitidos" value={overview.admitted_count} max={max} color="var(--color-success, #26734d)" /><ChartBar label="Ausentes" value={overview.absent_count} max={max} color="var(--color-warning, #a35d13)" /></div>)}
    </div>
    <ul className={styles.chartSummary} aria-label="Datos de comparación">{overviews.map((overview) => <li key={overview.process.id}><strong>{overview.process.name}</strong>: {formatNumber(overview.total_results)} postulantes, {formatNumber(overview.admitted_count)} admitidos, {formatNumber(overview.absent_count)} ausentes.</li>)}</ul>
  </section>;
}
