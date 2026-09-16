import type { ProcessOverview } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { isComparisonWinner, buildComparisonMetricRows } from "./comparisonTableRows";
import { ProcessComparisonMobile } from "./ProcessComparisonMobile";
import type { ComparisonMetricValues } from "./comparisonMetrics";

type ProcessComparisonTableProps = {
  overviews: ProcessOverview[];
  metricValues: ComparisonMetricValues;
};

export function ProcessComparisonTable({ overviews, metricValues }: ProcessComparisonTableProps) {
  const rows = buildComparisonMetricRows(overviews, metricValues);

  return (
    <div className={styles.processComparisonTableWrap}>
      <table className={styles.processComparisonTable}>
        <caption className={styles.visuallyHidden}>Comparación de postulantes, admitidos y ausentes entre procesos</caption>
        <thead>
          <tr>
            <th scope="col" aria-label="Métrica"></th>
            {overviews.map((overview) => (
              <th
                scope="col"
                key={overview.process.id}
              >
                <strong>{formatProcessLabel(overview.process)}</strong>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, index) => (
                <td
                  key={`${row.label}-${overviews[index].process.id}`}
                >
                  <span className={isComparisonWinner(row, index) ? styles.metricWinner : undefined}>{value}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ProcessComparisonMobile overviews={overviews} rows={rows} />
    </div>
  );
}
