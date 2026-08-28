import type { AdmissionProcess, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
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
          {processById.get(String(item.process.id))?.name ?? item.process.name}: {formatNumber(item.total_results)} postulantes · {formatNumber(item.average_score, 2)} promedio
        </span>
      ))}
    </aside>
  );
}
