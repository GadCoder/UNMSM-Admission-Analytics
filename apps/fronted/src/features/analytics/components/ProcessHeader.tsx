import type { ProcessOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { formatProcessLabel } from "../utils/processLabels";

type ProcessHeaderProps = {
  process: ProcessOverview["process"];
};

export function ProcessHeader({ process }: ProcessHeaderProps) {
  return (
    <div className={styles.heading}>
      <div>
        <span className={styles.cardLabel}>Proceso principal</span>
        <h2>{formatProcessLabel(process)}</h2>
      </div>
    </div>
  );
}
