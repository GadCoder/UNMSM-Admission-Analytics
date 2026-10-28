import type { AdmissionProcess } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import {
  formatCareerComparisonMetric,
  type AlignedCareerHistory,
  type CareerComparisonMetricKey,
} from "../utils/careerComparison";
import styles from "./CareerComparisonHistory.module.css";

type CareerHistoryTableProps = {
  processes: AdmissionProcess[];
  series: AlignedCareerHistory["series"];
  metric: CareerComparisonMetricKey;
  metricLabel: string;
};

export function CareerHistoryTable({
  processes,
  series,
  metric,
  metricLabel,
}: CareerHistoryTableProps) {
  return (
    <div className={styles.tableView}>
      <div
        className={styles.tableScroller}
        role="region"
        aria-label="Tabla de datos históricos"
        tabIndex={0}
      >
        <table>
          <caption>{metricLabel} por carrera y proceso</caption>
          <thead>
            <tr>
              <th scope="col">Proceso</th>
              {series.map((item) => (
                <th scope="col" key={item.id}>
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processes.map((process, index) => (
              <tr key={process.id}>
                <th scope="row">{formatProcessLabel(process)}</th>
                {series.map((item) => (
                  <td key={item.id} data-label={item.label}>
                    {item.values[index] === null
                      ? "—"
                      : formatCareerComparisonMetric(item.values[index], metric)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.scrollCue}>
        Desliza horizontalmente para ver todos los procesos y carreras.
      </p>
    </div>
  );
}
