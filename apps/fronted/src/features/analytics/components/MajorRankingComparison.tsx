import type { CSSProperties } from "react";
import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { calculateMetrics } from "./majorDemandRanking.utils";

type ComparisonMetricsProps = {
  major: MajorOverview;
  overview: ProcessOverview;
};

export function ComparisonMetrics({ major, overview }: ComparisonMetricsProps) {
  const { share } = calculateMetrics(major, overview.total_results);

  return (
    <div className={styles.majorComparisonCell}>
      <span className={styles.majorComparisonProcess}>
        {formatProcessLabel(overview.process)}
      </span>
      <strong>{formatNumber(major.total_results)}</strong>
      <span>{formatNumber(share, 1)}% del total</span>
    </div>
  );
}

type SingleProcessMetricsProps = {
  major: MajorOverview;
  overview: ProcessOverview;
};

export function SingleProcessMetrics({
  major,
  overview,
}: SingleProcessMetricsProps) {
  const { share } = calculateMetrics(major, overview.total_results);

  return (
    <div className={styles.majorRankingMeta}>
      <span>{formatNumber(share, 1)}% del total de postulantes</span>
    </div>
  );
}

type MajorComparisonHeaderProps = {
  overviews: ProcessOverview[];
  style: CSSProperties;
};

export function MajorComparisonHeader({
  overviews,
  style,
}: MajorComparisonHeaderProps) {
  return (
    <div
      className={styles.majorComparisonHeader}
      style={style}
      aria-hidden="true"
    >
      <span>Carrera</span>
      {overviews.map((overview) => (
        <span key={overview.process.id}>{formatProcessLabel(overview.process)}</span>
      ))}
    </div>
  );
}
