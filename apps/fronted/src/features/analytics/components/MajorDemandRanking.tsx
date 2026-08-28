import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

type MajorDemandRankingProps = { overview: ProcessOverview };

type RankingMetrics = {
  share: number;
  admissionRate: number;
  barWidth: number;
};

function calculateMetrics(major: MajorOverview, totalApplicants: number, maxApplicants: number): RankingMetrics {
  return {
    share: totalApplicants > 0 ? (major.total_results / totalApplicants) * 100 : 0,
    admissionRate: major.total_results > 0 ? (major.admitted_count / major.total_results) * 100 : 0,
    barWidth: maxApplicants > 0 ? (major.total_results / maxApplicants) * 100 : 0,
  };
}

function RankingItem({ major, rank, metrics }: { major: MajorOverview; rank: number; metrics: RankingMetrics }) {
  return <li className={styles.majorRankingItem}>
    <div className={styles.majorRankingHeader}>
      <span className={styles.majorRank}>{String(rank).padStart(2, "0")}</span>
      <strong>{major.major_name}</strong>
      <span className={styles.majorApplicants}>{formatNumber(major.total_results)} postulantes</span>
    </div>
    <div className={styles.majorRankingTrack} aria-hidden="true"><span style={{ width: `${metrics.barWidth}%` }} /></div>
    <div className={styles.majorRankingMeta}><span>{formatNumber(metrics.share, 1)}% del total</span><span>{formatNumber(metrics.admissionRate, 1)}% admitidos</span></div>
  </li>;
}

export function MajorDemandRanking({ overview }: MajorDemandRankingProps) {
  const majors = [...overview.majors].sort((left, right) => right.total_results - left.total_results).slice(0, 6);
  const maxApplicants = Math.max(...majors.map((major) => major.total_results), 0);
  const topMajor = majors[0];
  const topMetrics = topMajor ? calculateMetrics(topMajor, overview.total_results, maxApplicants) : null;

  return <section className={styles.card} aria-labelledby="major-chart-heading">
    <h2 id="major-chart-heading">Carreras con mayor demanda</h2>
    <p className={styles.chartDescription}>Las seis carreras con más postulantes en {overview.process.name}, con su peso sobre el total y tasa de admisión.</p>
    <ol className={styles.majorRanking} aria-label="Principales carreras por postulantes">
      {majors.map((major, index) => <RankingItem key={major.major_id} major={major} rank={index + 1} metrics={calculateMetrics(major, overview.total_results, maxApplicants)} />)}
    </ol>
    {topMajor && topMetrics && <p className={styles.chartInsight}><strong>{topMajor.major_name}</strong> concentra el {formatNumber(topMetrics.share, 1)}% de los postulantes y registra una tasa de admisión de {formatNumber(topMetrics.admissionRate, 1)}%.</p>}
  </section>;
}
