import type { MajorOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";

type MajorDemandSummaryProps = {
  mostDemanded?: MajorOverview;
  highestAdmission?: MajorOverview;
};

export function MajorDemandSummary({
  mostDemanded,
  highestAdmission,
}: MajorDemandSummaryProps) {
  if (!mostDemanded || !highestAdmission) return null;

  return (
    <p className={styles.demandChartSummary}>
      <strong>Lectura rápida:</strong> {mostDemanded.major_name} es la más demandada;{" "}
      {highestAdmission.major_name} tiene una de las mayores tasas de admisión entre estas carreras.
    </p>
  );
}
