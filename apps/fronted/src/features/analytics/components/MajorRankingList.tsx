import type { CSSProperties } from "react";
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

type ComparisonGridStyle = CSSProperties & {
  "--comparison-columns": string;
  "--comparison-count": string;
};

function getComparisonGridStyle(processCount: number): ComparisonGridStyle {
  return {
    "--comparison-columns": `minmax(0, 1fr) repeat(${processCount}, minmax(6.5rem, 1fr))`,
    "--comparison-count": String(processCount),
  };
}

function ComparisonMetrics({
  major,
  overview,
}: {
  major: MajorOverview;
  overview: ProcessOverview;
}) {
  const { share } = calculateMetrics(major, overview.total_results);
  const processLabel = formatProcessLabel(overview.process);

  return (
    <div className={styles.majorComparisonCell}>
      <span className={styles.majorComparisonProcess}>{processLabel}</span>
      <strong>{formatNumber(major.total_results)}</strong>
      <span>{formatNumber(share, 1)}% del total</span>
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
  const { share } = calculateMetrics(major, overview.total_results);

  return (
    <div className={styles.majorRankingMeta}>
      <span>{formatNumber(share, 1)}% del total de postulantes</span>
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
  const comparisonGridStyle = getComparisonGridStyle(overviews.length);

  return (
    <li
      className={styles.majorRankingItem}
      style={comparisonMode ? comparisonGridStyle : undefined}
    >
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

export function MajorRankingList({ majors, overviews }: MajorRankingListProps) {
  const comparisonMode = overviews.length > 1;
  const comparisonGridStyle = getComparisonGridStyle(overviews.length);

  return (
    <>
      {comparisonMode && (
        <div
          className={styles.majorComparisonHeader}
          style={comparisonGridStyle}
          aria-hidden="true"
        >
          <span>Carrera</span>
          {overviews.map((overview) => (
            <span key={overview.process.id}>{formatProcessLabel(overview.process)}</span>
          ))}
        </div>
      )}
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
    </>
  );
}
