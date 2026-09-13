import type { ProcessOverview, MajorOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { MajorComparisonHeader } from "./MajorRankingComparison";
import { MajorRankingItem } from "./MajorRankingItem";
import { getComparisonGridStyle } from "./majorRankingList.utils";

type MajorRankingListProps = {
  majors: MajorOverview[];
  overviews: ProcessOverview[];
};

export function MajorRankingList({ majors, overviews }: MajorRankingListProps) {
  const comparisonMode = overviews.length > 1;
  const comparisonGridStyle = getComparisonGridStyle(overviews.length);

  return (
    <>
      {overviews.length === 1 && (
        <div className={styles.majorRankingHeaderRow} aria-hidden="true">
          <span>#</span>
          <span>Carrera</span>
          <span>Postulantes</span>
        </div>
      )}
      {comparisonMode && (
        <MajorComparisonHeader
          overviews={overviews}
          style={comparisonGridStyle}
        />
      )}
      <ol className={styles.majorRanking} aria-label="Principales carreras por postulantes">
        {majors.map((major, index) => (
          <MajorRankingItem
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
