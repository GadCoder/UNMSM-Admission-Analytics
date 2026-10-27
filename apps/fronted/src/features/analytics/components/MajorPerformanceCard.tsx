import { useState } from "react";
import { Link } from "react-router-dom";

import type { MajorOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { careerDetailHref, type CareerNavigationContext } from "../utils/careerNavigation";
import { NewMajorBadge } from "./NewMajorBadge";
import styles from "../pages/DashboardPage.module.css";
import { admissionRate } from "./majorPerformance.utils";

type MajorPerformanceCardProps = { major: MajorOverview; rank: number; processId: number; navigation?: CareerNavigationContext };

export function MajorPerformanceCard({ major, rank, processId, navigation }: MajorPerformanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = `major-performance-details-${major.major_id}`;

  return <div className={styles.performanceCard}>
    <div className={styles.performanceCardHeader}>
      <span className={styles.performanceCardRank}>{String(rank).padStart(2, "0")}</span>
      <span className={styles.performanceCardMain}>
        <Link className={styles.majorDetailLink} to={careerDetailHref(major.major_id, processId, navigation)}>
          <strong>{major.major_name}</strong>
        </Link>
        {major.is_new && <NewMajorBadge />}
        <span>{formatNumber(major.total_results)} postulantes · {formatNumber(major.admitted_count)} admitidos</span>
      </span>
      <button
        className={styles.performanceCardToggle}
        type="button"
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        aria-label={`${isExpanded ? "Ocultar" : "Mostrar"} indicadores de ${major.major_name}`}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      >
        <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16"><path d="m3.5 6 4.5 4 4.5-4" /></svg>
      </button>
    </div>
    <dl id={detailsId} className={styles.performanceCardDetails} hidden={!isExpanded}>
      <div><dt>Tasa de admisión</dt><dd>{formatNumber(admissionRate(major), 1)}%</dd></div>
      <div><dt>Ausentes</dt><dd>{formatNumber(major.absent_count)}</dd></div>
      <div><dt>Promedio</dt><dd>{formatNumber(major.average_score, 2)}</dd></div>
    </dl>
  </div>;
}
