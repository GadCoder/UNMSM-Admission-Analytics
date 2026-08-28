import type { ProcessOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";

type ProcessHeaderProps = {
  process: ProcessOverview["process"];
};

export function ProcessHeader({ process }: ProcessHeaderProps) {
  return (
    <div className={styles.heading}>
      <div>
        <span className={styles.cardLabel}>Proceso principal</span>
        <h2>{process.name}</h2>
      </div>
      <span>
        {process.year} · etapa {process.sequence}
      </span>
    </div>
  );
}
