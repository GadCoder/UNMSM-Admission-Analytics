import type { DemandChartModel } from "./majorDemandRanking.utils";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

type DemandMapLegendProps = Pick<DemandChartModel, "points"> & {
  activeMajorId: number | null;
  selectedMajorId: number | null;
  onSelectMajor: (majorId: number) => void;
  onHoverMajor: (majorId: number | null) => void;
};

export function DemandMapLegend({
  points,
  activeMajorId,
  selectedMajorId,
  onSelectMajor,
  onHoverMajor,
}: DemandMapLegendProps) {
  return (
    <ol className={styles.demandMapCareerList}>
      {points.map(({ major, admissionRate }) => {
        const isActive = activeMajorId === major.major_id;
        const isSelected = selectedMajorId === major.major_id;
        return (
          <li key={major.major_id}>
            <button
              type="button"
              className={`${styles.demandMapCareer} ${isActive ? styles.demandMapCareerActive : ""}`}
              aria-pressed={isSelected}
              onClick={() => onSelectMajor(major.major_id)}
              onPointerEnter={() => onHoverMajor(major.major_id)}
              onPointerLeave={() => onHoverMajor(null)}
              onFocus={() => onHoverMajor(major.major_id)}
              onBlur={() => onHoverMajor(null)}
            >
              <strong>{major.major_name}</strong>
              <span className={styles.demandMapCareerMetrics}>
                <span>{formatNumber(major.total_results)} postulantes</span>
                <span>{formatNumber(admissionRate, 1)}% ingresó</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
