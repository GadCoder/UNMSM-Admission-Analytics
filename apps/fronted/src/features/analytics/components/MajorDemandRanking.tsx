import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { MajorDemandChart } from "./MajorDemandChart";
import { MajorRankingList } from "./MajorRankingList";
import { getTopMajors } from "./majorDemandRanking.utils";

type MajorDemandRankingProps = {
  overview: ProcessOverview;
  comparisons?: ProcessOverview[];
};

export function MajorDemandRanking({
  overview,
  comparisons = [],
}: MajorDemandRankingProps) {
  const overviews = [overview, ...comparisons];
  const majors = getTopMajors(overview.majors);
  const comparisonMode = comparisons.length > 0;

  return (
    <section className={styles.card} aria-labelledby="major-chart-heading">
      <h2 id="major-chart-heading">Carreras con mayor demanda</h2>
      <p className={styles.chartDescription}>
        {comparisonMode
          ? "Participación de cada carrera sobre el total de postulantes de cada proceso."
          : `Las seis carreras con más postulantes en ${formatProcessLabel(overview.process)}, con su peso sobre el total y tasa de admisión.`}
        <strong className={styles.chartContext}>
          {comparisonMode ? "Totales: " : "Total: "}
          {overviews.map((item, index) => (
            <span key={item.process.id}>
              {index > 0 ? " · " : ""}
              {formatNumber(item.total_results)} presentes en {formatProcessLabel(item.process)}
            </span>
          ))}
        </strong>
      </p>
      <div className={styles.majorDemandLayout}>
        <div className={styles.majorMetricsPanel}>
          <h3 className={styles.majorPanelHeading}>Ranking de postulantes</h3>
          <MajorRankingList majors={majors} overviews={overviews} />
        </div>
        <MajorDemandChart
          majors={majors}
          totalApplicants={overview.total_results}
          process={overview.process}
        />
      </div>
    </section>
  );
}
