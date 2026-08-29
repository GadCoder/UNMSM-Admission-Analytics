import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";
import { formatProcessLabel } from "../utils/processLabels";

type MajorDemandRankingProps = { overview: ProcessOverview; comparisons?: ProcessOverview[] };

type RankingMetrics = {
  share: number;
  admissionRate: number;
};

function calculateMetrics(major: MajorOverview, totalApplicants: number): RankingMetrics {
  return {
    share: totalApplicants > 0 ? (major.total_results / totalApplicants) * 100 : 0,
    admissionRate: major.total_results > 0 ? (major.admitted_count / major.total_results) * 100 : 0,
  };
}

function RankingBar({ major, overview }: { major: MajorOverview; overview: ProcessOverview }) {
  const metrics = calculateMetrics(major, overview.total_results);

  return <div className={styles.majorComparisonRow}>
    <span className={styles.majorProcess}>{formatProcessLabel(overview.process)}</span>
    <div className={styles.majorRankingTrack} aria-hidden="true"><span style={{ width: `${Math.min(metrics.share, 100)}%` }} /></div>
    <div className={styles.majorRankingMeta}><span>{formatNumber(major.total_results)} postulantes</span><span>{formatNumber(metrics.share, 1)}% del total de postulantes</span></div>
  </div>;
}

function SingleProcessBar({ major, overview }: { major: MajorOverview; overview: ProcessOverview }) {
  const metrics = calculateMetrics(major, overview.total_results);

  return <>
    <div className={styles.majorRankingTrack} aria-hidden="true"><span style={{ width: `${Math.min(metrics.share, 100)}%` }} /></div>
    <div className={styles.majorRankingMeta}><span>{formatNumber(metrics.share, 1)}% del total de postulantes</span><span>{formatNumber(metrics.admissionRate, 1)}% tasa de admisión</span></div>
  </>;
}

function RankingItem({ major, rank, overviews }: { major: MajorOverview; rank: number; overviews: ProcessOverview[] }) {
  const comparisonMode = overviews.length > 1;

  return <li className={styles.majorRankingItem}>
    <div className={styles.majorRankingHeader}>
      <span className={styles.majorRank}>{String(rank).padStart(2, "0")}</span>
      <strong>{major.major_name}</strong>
      {!comparisonMode && <span className={styles.majorApplicants}>{formatNumber(major.total_results)} postulantes</span>}
    </div>
    {comparisonMode ? overviews.map((overview) => {
      const processMajor = overview.majors.find((item) => item.major_id === major.major_id);
      return processMajor ? <RankingBar key={overview.process.id} major={processMajor} overview={overview} /> : null;
    }) : <SingleProcessBar major={major} overview={overviews[0]} />}
  </li>;
}

export function MajorDemandRanking({ overview, comparisons = [] }: MajorDemandRankingProps) {
  const overviews = [overview, ...comparisons];
  const majors = [...overview.majors].sort((left, right) => right.total_results - left.total_results).slice(0, 6);
  const topMajor = majors[0];
  const topMetrics = topMajor ? calculateMetrics(topMajor, overview.total_results) : null;
  const comparisonMode = comparisons.length > 0;

  return <section className={styles.card} aria-labelledby="major-chart-heading">
    <h2 id="major-chart-heading">Carreras con mayor demanda</h2>
    <p className={styles.chartDescription}>{comparisonMode ? "Participación de cada carrera sobre el total de postulantes de cada proceso." : `Las seis carreras con más postulantes en ${formatProcessLabel(overview.process)}, con su peso sobre el total y tasa de admisión.`}</p>
    {comparisonMode && <p className={styles.chartLegend}>Cada proceso usa su propia escala del 0 al 100%.</p>}
    <ol className={styles.majorRanking} aria-label="Principales carreras por postulantes">
      {majors.map((major, index) => <RankingItem key={major.major_id} major={major} rank={index + 1} overviews={overviews} />)}
    </ol>
    {topMajor && topMetrics && <p className={styles.chartInsight}><strong>{topMajor.major_name}</strong> concentra el {formatNumber(topMetrics.share, 1)}% de los postulantes y registra una tasa de admisión de {formatNumber(topMetrics.admissionRate, 1)}%.</p>}
  </section>;
}
