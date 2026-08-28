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

type MajorChartProps = { overview: ProcessOverview };
export function TopMajorsChart({ overview }: MajorChartProps) {
  const majors = [...overview.majors].sort((left, right) => right.total_results - left.total_results).slice(0, 6);
  const maxApplicants = Math.max(...majors.map((major) => major.total_results), 0);
  const topMajor = majors[0];
  const topShare = topMajor && overview.total_results > 0 ? (topMajor.total_results / overview.total_results) * 100 : 0;
  const topAdmissionRate = topMajor && topMajor.total_results > 0 ? (topMajor.admitted_count / topMajor.total_results) * 100 : 0;

  return <section className={styles.card} aria-labelledby="major-chart-heading">
    <h2 id="major-chart-heading">Carreras con mayor demanda</h2>
    <p className={styles.chartDescription}>Las seis carreras con más postulantes en {overview.process.name}, con su peso sobre el total y tasa de admisión.</p>
    <ol className={styles.majorRanking} aria-label="Principales carreras por postulantes">
      {majors.map((major, index) => {
        const share = overview.total_results > 0 ? (major.total_results / overview.total_results) * 100 : 0;
        const admissionRate = major.total_results > 0 ? (major.admitted_count / major.total_results) * 100 : 0;
        const width = maxApplicants > 0 ? (major.total_results / maxApplicants) * 100 : 0;
        return <li className={styles.majorRankingItem} key={major.major_id}>
          <div className={styles.majorRankingHeader}>
            <span className={styles.majorRank}>{String(index + 1).padStart(2, "0")}</span>
            <strong>{major.major_name}</strong>
            <span className={styles.majorApplicants}>{formatNumber(major.total_results)} postulantes</span>
          </div>
          <div className={styles.majorRankingTrack} aria-hidden="true"><span style={{ width: `${width}%` }} /></div>
          <div className={styles.majorRankingMeta}><span>{formatNumber(share, 1)}% del total</span><span>{formatNumber(admissionRate, 1)}% admitidos</span></div>
        </li>;
      })}
    </ol>
    {topMajor && <p className={styles.chartInsight}><strong>{topMajor.major_name}</strong> concentra el {formatNumber(topShare, 1)}% de los postulantes y registra una tasa de admisión de {formatNumber(topAdmissionRate, 1)}%.</p>}
  </section>;
}
