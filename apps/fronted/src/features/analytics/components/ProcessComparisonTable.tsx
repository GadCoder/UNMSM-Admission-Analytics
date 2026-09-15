import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import {
  isHighestValue,
  type ComparisonMetricValues,
  percentage,
} from "./comparisonMetrics";

type ProcessComparisonTableProps = {
  overviews: ProcessOverview[];
  metricValues: ComparisonMetricValues;
};

type ComparisonMetricRow = {
  label: string;
  values: string[];
  comparison: Array<number | null>;
};

export function ProcessComparisonTable({ overviews, metricValues }: ProcessComparisonTableProps) {
  const rows = buildMetricRows(overviews, metricValues);

  return (
    <div className={styles.processComparisonTableWrap}>
      <table className={styles.processComparisonTable}>
        <caption className={styles.visuallyHidden}>Comparación de postulantes, admitidos y ausentes entre procesos</caption>
        <thead>
          <tr>
            <th scope="col">Métrica</th>
            {overviews.map((overview, index) => (
              <th scope="col" key={overview.process.id}>
                <span className={styles.comparisonProcessRole}>{index === 0 ? "Analizado" : "Comparado"}</span>
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
                <td key={`${row.label}-${overviews[index].process.id}`}>
                  <span className={isHighestValue(row.comparison[index], row.comparison) ? styles.metricWinner : undefined}>{value}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildMetricRows(overviews: ProcessOverview[], metricValues: ComparisonMetricValues): ComparisonMetricRow[] {
  return [
    {
      label: "Postulantes",
      values: overviews.map((overview) => formatNumber(overview.total_results)),
      comparison: metricValues.applicants,
    },
    {
      label: "Postulantes ausentes",
      values: overviews.map((overview) => formatNumber(overview.absent_count)),
      comparison: metricValues.absent,
    },
    {
      label: "Porcentaje de ausentes",
      values: overviews.map((overview) => `${formatNumber(percentage(overview.absent_count, overview.total_results), 1)}%`),
      comparison: metricValues.absentRate,
    },
    {
      label: "Ingresantes",
      values: overviews.map((overview) => formatNumber(overview.admitted_count)),
      comparison: metricValues.entrants,
    },
    {
      label: "Porcentaje de ingresantes",
      values: overviews.map((overview) => `${formatNumber(percentage(overview.admitted_count, overview.total_results), 1)}%`),
      comparison: metricValues.admissionRate,
    },
    {
      label: "Puntaje máximo",
      values: overviews.map((overview) => overview.highest_score === null ? "—" : formatNumber(Number(overview.highest_score), 2)),
      comparison: metricValues.highest,
    },
    {
      label: "Puntaje promedio",
      values: overviews.map((overview) => overview.average_score === null ? "—" : formatNumber(Number(overview.average_score), 2)),
      comparison: metricValues.average,
    },
  ];
}
