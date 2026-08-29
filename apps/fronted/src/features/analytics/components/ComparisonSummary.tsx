import type { AdmissionProcess, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";

type ComparisonSummaryProps = {
  comparisons: ProcessOverview[];
  processById: Map<string, AdmissionProcess>;
};

export function ComparisonSummary({
  comparisons,
  processById,
}: ComparisonSummaryProps) {
  if (comparisons.length === 0) return null;

  return (
    <aside className={styles.comparison} aria-label="Resumen de comparación">
      <strong>Comparación</strong>
      {comparisons.map((item) => (
        <span key={item.process.id}>
          {formatProcessLabel(processById.get(String(item.process.id)) ?? item.process)}: {formatNumber(item.total_results)} postulantes · {formatNumber(item.average_score, 2)} promedio
        </span>
      ))}
    </aside>
  );
}
