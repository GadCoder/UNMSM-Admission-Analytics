import { Link } from "react-router-dom";

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

function ComparisonMetrics({ major, overview }: { major: MajorOverview; overview: ProcessOverview }) {
  const metrics = calculateMetrics(major, overview.total_results);

  return <div className={styles.majorComparisonRow}>
    <span className={styles.majorProcess}>{formatProcessLabel(overview.process)}</span>
    <div className={styles.majorRankingMeta}><span>{formatNumber(major.total_results)} postulantes</span><span>{formatNumber(metrics.share, 1)}% del total de postulantes</span></div>
  </div>;
}

function SingleProcessMetrics({ major, overview }: { major: MajorOverview; overview: ProcessOverview }) {
  const metrics = calculateMetrics(major, overview.total_results);

  return <div className={styles.majorRankingMeta}><span>{formatNumber(metrics.share, 1)}% del total de postulantes</span><span>{formatNumber(metrics.admissionRate, 1)}% tasa de admisión</span></div>;
}

function DemandChart({ majors, totalApplicants, process }: { majors: MajorOverview[]; totalApplicants: number; process: ProcessOverview["process"] }) {
  const maxShare = Math.max(...majors.map((major) => totalApplicants > 0 ? (major.total_results / totalApplicants) * 100 : 0), 1);
  const maxAdmissionRate = Math.max(...majors.map((major) => major.total_results > 0 ? (major.admitted_count / major.total_results) * 100 : 0), 1);
  const mostDemanded = majors[0];
  const highestAdmission = majors.reduce((current, major) => {
    const currentRate = current.total_results > 0 ? current.admitted_count / current.total_results : 0;
    const majorRate = major.total_results > 0 ? major.admitted_count / major.total_results : 0;
    return majorRate > currentRate ? major : current;
  }, majors[0]);

  return <section className={styles.demandChart} aria-labelledby="demand-chart-heading">
    <div className={styles.demandChartHeader}>
      <h3 id="demand-chart-heading">Demanda y admisión</h3>
      <span>Proceso representado: {formatProcessLabel(process)}. Cada punto es una carrera. Más a la derecha significa más postulantes; más arriba, una mayor tasa de admisión. Los números coinciden con el ranking de la izquierda.</span>
    </div>
    <div className={styles.demandMatrix} role="img" aria-label="Matriz de demanda y tasa de admisión por carrera">
      <span className={styles.demandMatrixYAxis}>Tasa de admisión</span>
      <div className={styles.demandMatrixPlot}>
        <span className={styles.demandMatrixHorizontalLabel}>Alta admisión</span>
        <span className={styles.demandMatrixVerticalLabel}>Baja admisión</span>
        {majors.map((major, index) => {
          const share = totalApplicants > 0 ? (major.total_results / totalApplicants) * 100 : 0;
          const admissionRate = major.total_results > 0 ? (major.admitted_count / major.total_results) * 100 : 0;
          return <span
            key={major.major_id}
            className={styles.demandMatrixPoint}
            style={{ left: `${Math.min(96, Math.max(4, (share / maxShare) * 100))}%`, bottom: `${Math.min(96, Math.max(4, (admissionRate / maxAdmissionRate) * 100))}%` }}
            title={`${major.major_name}: ${formatNumber(share, 1)}% de postulantes, ${formatNumber(admissionRate, 1)}% de admisión`}
          >
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.visuallyHidden}>{major.major_name}: {formatNumber(share, 1)}% de postulantes, {formatNumber(admissionRate, 1)}% de admisión</span>
          </span>;
        })}
      </div>
      <div className={styles.demandMatrixXAxis}><span>Menor demanda</span><span>Mayor demanda</span></div>
    </div>
    <ol className={styles.visuallyHidden} aria-label={`Datos de demanda y admisión de ${formatProcessLabel(process)}`}>
      {majors.map((major, index) => {
        const share = totalApplicants > 0 ? (major.total_results / totalApplicants) * 100 : 0;
        const admissionRate = major.total_results > 0 ? (major.admitted_count / major.total_results) * 100 : 0;
        return <li key={major.major_id}>{String(index + 1).padStart(2, "0")}: {major.major_name}, {formatNumber(share, 1)}% de postulantes y {formatNumber(admissionRate, 1)}% de admisión.</li>;
      })}
    </ol>
    {mostDemanded && highestAdmission && <p className={styles.demandChartSummary}><strong>Lectura rápida:</strong> {mostDemanded.major_name} es la más demandada; {highestAdmission.major_name} tiene una de las mayores tasas de admisión entre estas carreras.</p>}
  </section>;
}

function RankingItem({ major, rank, overviews }: { major: MajorOverview; rank: number; overviews: ProcessOverview[] }) {
  const comparisonMode = overviews.length > 1;

  return <li className={styles.majorRankingItem}>
    <div className={styles.majorRankingHeader}>
      <span className={styles.majorRank}>{String(rank).padStart(2, "0")}</span>
      <Link className={styles.majorDetailLink} to={`/analytics/careers/${major.major_id}?process=${overviews[0].process.id}${overviews.length > 1 ? `&compare=${overviews.slice(1).map((item) => item.process.id).join(",")}` : ""}`}>
        <strong>{major.major_name}</strong>
      </Link>
      {!comparisonMode && <span className={styles.majorApplicants}>{formatNumber(major.total_results)} postulantes</span>}
    </div>
    {comparisonMode ? overviews.map((overview) => {
      const processMajor = overview.majors.find((item) => item.major_id === major.major_id);
      return processMajor ? <ComparisonMetrics key={overview.process.id} major={processMajor} overview={overview} /> : null;
    }) : <SingleProcessMetrics major={major} overview={overviews[0]} />}
  </li>;
}

export function MajorDemandRanking({ overview, comparisons = [] }: MajorDemandRankingProps) {
  const overviews = [overview, ...comparisons];
  const majors = [...overview.majors].sort((left, right) => right.total_results - left.total_results).slice(0, 6);
  const comparisonMode = comparisons.length > 0;

  return <section className={styles.card} aria-labelledby="major-chart-heading">
    <h2 id="major-chart-heading">Carreras con mayor demanda</h2>
    <p className={styles.chartDescription}>
      {comparisonMode
        ? "Participación de cada carrera sobre el total de postulantes de cada proceso."
        : `Las seis carreras con más postulantes en ${formatProcessLabel(overview.process)}, con su peso sobre el total y tasa de admisión.`}
      <strong className={styles.chartContext}>
        {comparisonMode ? "Totales: " : "Total: "}
        {overviews.map((item, index) => (
          <span key={item.process.id}>{index > 0 ? " · " : ""}{formatNumber(item.total_results)} presentes en {formatProcessLabel(item.process)}</span>
        ))}
      </strong>
    </p>
    <div className={styles.majorDemandLayout}>
      <div className={styles.majorMetricsPanel}>
        <h3 className={styles.majorPanelHeading}>Ranking de postulantes</h3>
        <ol className={styles.majorRanking} aria-label="Principales carreras por postulantes">
          {majors.map((major, index) => <RankingItem key={major.major_id} major={major} rank={index + 1} overviews={overviews} />)}
        </ol>
      </div>
      <DemandChart majors={majors} totalApplicants={overview.total_results} process={overview.process} />
    </div>
  </section>;
}
