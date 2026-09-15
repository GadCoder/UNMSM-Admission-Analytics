import type { ProcessOverview } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { isComparisonWinner, type ComparisonMetricRow } from "./comparisonTableRows";

type ProcessComparisonMobileProps = {
  overviews: ProcessOverview[];
  rows: ComparisonMetricRow[];
};

export function ProcessComparisonMobile({ overviews, rows }: ProcessComparisonMobileProps) {
  return (
    <div className={styles.comparisonMobile} aria-label="Comparación móvil por métrica">
      {rows.map((row) => (
        <section className={styles.comparisonMobileMetric} key={row.label}>
          <h3>{row.label}</h3>
          <div className={styles.comparisonMobileValues}>
            {row.values.map((value, index) => (
              <div
                className={`${styles.comparisonMobileValue} ${index === 0 ? styles.comparisonBaseColumn : ""}`}
                key={`${row.label}-${overviews[index].process.id}`}
              >
                <span>{formatProcessLabel(overviews[index].process)}</span>
                <strong className={isComparisonWinner(row, index) ? styles.metricWinner : undefined}>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
