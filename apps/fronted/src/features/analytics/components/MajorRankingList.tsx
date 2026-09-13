import { Link } from "react-router-dom";

import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { calculateMetrics } from "./majorDemandRanking.utils";

type MajorRankingListProps = {
  majors: MajorOverview[];
  overviews: ProcessOverview[];
};

function ComparisonMetrics({
  major,
  overview,
}: {
  major: MajorOverview;
  overview: ProcessOverview;
}) {
  const { share } = calculateMetrics(major, overview.total_results);

  return (
    <div className={styles.majorComparisonRow}>
      <span className={styles.majorProcess}>{formatProcessLabel(overview.process)}</span>
      <div className={styles.majorRankingMeta}>
        <span>{formatNumber(major.total_results)} postulantes</span>
        <span>{formatNumber(share, 1)}% del total de postulantes</span>
      </div>
    </div>
  );
}

function SingleProcessMetrics({
  major,
  overview,
}: {
  major: MajorOverview;
  overview: ProcessOverview;
}) {
  const { share, admissionRate } = calculateMetrics(major, overview.total_results);

  return (
    <div className={styles.majorRankingMeta}>
      <span>{formatNumber(share, 1)}% del total de postulantes</span>
      <span>{formatNumber(admissionRate, 1)}% tasa de admisión</span>
    </div>
  );
}

function RankingItem({
  major,
  rank,
  overviews,
}: {
  major: MajorOverview;
  rank: number;
  overviews: ProcessOverview[];
}) {
  const comparisonMode = overviews.length > 1;
  const [primary, ...comparisons] = overviews;
  const comparisonQuery = comparisons.length
    ? `&compare=${comparisons.map((item) => item.process.id).join(",")}`
    : "";

  return (
    <li className={styles.majorRankingItem}>
      <div className={styles.majorRankingHeader}>
        <span className={styles.majorRank}>{String(rank).padStart(2, "0")}</span>
        <Link
          className={styles.majorDetailLink}
          to={`/analytics/careers/${major.major_id}?process=${primary.process.id}${comparisonQuery}`}
        >
          <strong>{major.major_name}</strong>
        </Link>
        {!comparisonMode && (
          <span className={styles.majorApplicants}>
            {formatNumber(major.total_results)} postulantes
          </span>
        )}
      </div>
      {comparisonMode ? (
        overviews.map((overview) => {
          const processMajor = overview.majors.find(
            (item) => item.major_id === major.major_id,
          );
          return processMajor ? (
            <ComparisonMetrics
              key={overview.process.id}
              major={processMajor}
              overview={overview}
            />
          ) : null;
        })
      ) : (
        <SingleProcessMetrics major={major} overview={primary} />
      )}
    </li>
  );
}

export function MajorRankingList({ majors, overviews }: MajorRankingListProps) {
  return (
    <ol className={styles.majorRanking} aria-label="Principales carreras por postulantes">
      {majors.map((major, index) => (
        <RankingItem
          key={major.major_id}
          major={major}
          rank={index + 1}
          overviews={overviews}
        />
      ))}
    </ol>
  );
}
