import { Link } from "react-router-dom";

import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";
import { ComparisonMetrics, SingleProcessMetrics } from "./MajorRankingComparison";
import { getComparisonGridStyle } from "./majorRankingList.utils";

type MajorRankingItemProps = {
  major: MajorOverview;
  rank: number;
  overviews: ProcessOverview[];
};

export function MajorRankingItem({
  major,
  rank,
  overviews,
}: MajorRankingItemProps) {
  const comparisonMode = overviews.length > 1;
  const [primary] = overviews;
  const comparisonGridStyle = getComparisonGridStyle(overviews.length);


  return (
    <li
      className={`${styles.majorRankingItem} ${comparisonMode ? styles.majorRankingComparisonItem : styles.majorRankingSingleItem}`}
      style={comparisonMode ? comparisonGridStyle : undefined}
    >
      <div className={styles.majorRankingHeader}>
        <span className={styles.majorRank}>{String(rank).padStart(2, "0")}</span>
        <Link
          className={styles.majorDetailLink}
          to={`/analytics/careers/${major.major_id}?process=${primary.process.id}`}
        >
          <strong>{major.major_name}</strong>
        </Link>
        {!comparisonMode && (
          <span className={styles.majorApplicants}>
            {formatNumber(major.total_results)}
          </span>
        )}
      </div>
      {comparisonMode ? (
        <div className={styles.majorComparisonValues}>
          {overviews.map((overview) => {
            const processMajor = overview.majors.find(
              (item) => item.major_id === major.major_id,
            );
            return processMajor ? (
              <ComparisonMetrics
                key={overview.process.id}
                major={processMajor}
                overview={overview}
              />
            ) : (
              <span key={overview.process.id} />
            );
          })}
        </div>
      ) : (
        <SingleProcessMetrics major={major} overview={primary} />
      )}
    </li>
  );
}
