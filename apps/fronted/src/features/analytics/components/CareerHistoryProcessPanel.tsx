import type { AdmissionProcess } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import {
  formatCareerComparisonMetric,
  getCareerSeriesStyle,
  type AlignedCareerHistory,
  type CareerComparisonMetricKey,
} from "../utils/careerComparison";
import styles from "./CareerComparisonHistory.module.css";

type CareerHistoryProcessPanelProps = {
  processes: AdmissionProcess[];
  series: AlignedCareerHistory["series"];
  index: number;
  metric: CareerComparisonMetricKey;
  metricLabel: string;
  styleSlots: ReadonlyMap<number | string, number>;
  pinned: boolean;
  onClear: () => void;
};

export function CareerHistoryProcessPanel({
  processes,
  series,
  index,
  metric,
  metricLabel,
  styleSlots,
  pinned,
  onClear,
}: CareerHistoryProcessPanelProps) {
  return (
    <div className={styles.processPanel} role="status" aria-live="polite">
      <div className={styles.panelHeader}>
        <strong className={styles.processTitle}>
          {formatProcessLabel(processes[index])} · {metricLabel}
        </strong>
        {pinned && (
          <button type="button" className={styles.clearSelection} onClick={onClear}>
            Quitar selección
          </button>
        )}
      </div>
      <ul>
        {series.map((item) => {
          const value = item.values[index];
          const style = getCareerSeriesStyle(styleSlots.get(item.id) ?? 0);
          const availableProcesses = item.values.flatMap((historicalValue, processIndex) =>
            historicalValue !== null && Number.isFinite(historicalValue)
              ? [formatProcessLabel(processes[processIndex])]
              : [],
          );
          return (
            <li key={item.id}>
              <span>
                <i style={{ backgroundColor: style.color }} aria-hidden="true" />
                {item.label}
              </span>
              <strong>{value === null ? "—" : formatCareerComparisonMetric(value, metric)}</strong>
              {availableProcesses.length === 1 && (
                <small>
                  Datos disponibles para esta métrica en {availableProcesses[0]}. Un solo proceso no
                  permite evaluar su evolución.
                </small>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
