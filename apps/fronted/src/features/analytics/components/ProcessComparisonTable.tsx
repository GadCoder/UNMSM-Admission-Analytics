import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber, formatSignedDifference } from "../utils/formatters";
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
  deltaDigits: number;
  deltaSuffix: string;
};

export function ProcessComparisonTable({ overviews, metricValues }: ProcessComparisonTableProps) {
  const rows = buildMetricRows(overviews, metricValues);

  return (
    <div className={styles.processComparisonTableWrap}>
      <p className={styles.comparisonTableContext}>
        La columna destacada corresponde al proceso seleccionado. Las diferencias bajo cada comparación son frente a {formatProcessLabel(overviews[0].process)}.
      </p>
      <table className={styles.processComparisonTable}>
        <caption className={styles.visuallyHidden}>Comparación de postulantes, admitidos y ausentes entre procesos</caption>
        <thead>
          <tr>
            <th scope="col" aria-label="Métrica"></th>
            {overviews.map((overview, index) => (
              <th
                scope="col"
                key={overview.process.id}
                className={index === 0 ? styles.comparisonBaseColumn : undefined}
                aria-label={index === 0 ? `Base, proceso seleccionado, ${formatProcessLabel(overview.process)}` : undefined}
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
                  className={index === 0 ? styles.comparisonBaseColumn : undefined}
                >
                  <span className={isHighestValue(row.comparison[index], row.comparison) ? styles.metricWinner : undefined}>{value}</span>
                  {index > 0 && <span className={styles.comparisonDelta}>{formatDelta(row.comparison[index], row.comparison[0], row.deltaDigits, row.deltaSuffix)} frente a {formatProcessLabel(overviews[0].process)}</span>}
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
      deltaDigits: 0,
      deltaSuffix: "",
    },
    {
      label: "Postulantes ausentes",
      values: overviews.map((overview) => formatNumber(overview.absent_count)),
      comparison: metricValues.absent,
      deltaDigits: 0,
      deltaSuffix: "",
    },
    {
      label: "Porcentaje de ausentes",
      values: overviews.map((overview) => `${formatNumber(percentage(overview.absent_count, overview.total_results), 1)}%`),
      comparison: metricValues.absentRate,
      deltaDigits: 1,
      deltaSuffix: " pp",
    },
    {
      label: "Ingresantes",
      values: overviews.map((overview) => formatNumber(overview.admitted_count)),
      comparison: metricValues.entrants,
      deltaDigits: 0,
      deltaSuffix: "",
    },
    {
      label: "Porcentaje de ingresantes",
      values: overviews.map((overview) => `${formatNumber(percentage(overview.admitted_count, overview.total_results), 1)}%`),
      comparison: metricValues.admissionRate,
      deltaDigits: 1,
      deltaSuffix: " pp",
    },
    {
      label: "Puntaje máximo",
      values: overviews.map((overview) => overview.highest_score === null ? "—" : formatNumber(Number(overview.highest_score), 2)),
      comparison: metricValues.highest,
      deltaDigits: 2,
      deltaSuffix: " pts",
    },
    {
      label: "Puntaje promedio",
      values: overviews.map((overview) => overview.average_score === null ? "—" : formatNumber(Number(overview.average_score), 2)),
      comparison: metricValues.average,
      deltaDigits: 2,
      deltaSuffix: " pts",
    },
  ];
}

function formatDelta(value: number | null, base: number | null, digits: number, suffix: string) {
  if (value === null || base === null) return "—";
  return formatSignedDifference(value - base, digits, suffix);
}
