import { useMemo, useState } from "react";

import type { ProcessMetrics } from "../api/analytics.types";
import {
  METRIC_OPTIONS,
  getMetricValue,
  type MetricKey,
} from "./metricHistory";
import { MetricHistoryPlot } from "./MetricHistoryPlot";
import { AnalyticsSurface } from "./AnalyticsSurface";
import { SelectField } from "./SelectField";
import styles from "./MetricHistoryChart.module.css";

type MetricHistoryChartProps = {
  items: ProcessMetrics[];
  title: string;
  status?: "ready" | "loading" | "error";
};

function getStatusMessage(status: MetricHistoryChartProps["status"], hasValues: boolean) {
  if (status === "loading") {
    return <p className={styles.metricHistoryEmpty} role="status">Cargando evolución histórica…</p>;
  }
  if (status === "error") {
    return <p className={styles.metricHistoryEmpty} role="alert">No pudimos cargar la evolución histórica.</p>;
  }
  if (!hasValues) {
    return <p className={styles.metricHistoryEmpty}>Aún no hay suficientes procesos publicados para mostrar una evolución histórica.</p>;
  }
  return null;
}

export function MetricHistoryChart({
  items,
  title,
  status = "ready",
}: MetricHistoryChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("total_results");
  const metric = METRIC_OPTIONS.find((option) => option.key === selectedMetric) ?? METRIC_OPTIONS[0];
  const hasMetricValues = useMemo(
    () => items.some((item) => getMetricValue(item, selectedMetric) !== null),
    [items, selectedMetric],
  );
  const statusMessage = getStatusMessage(status, hasMetricValues);

  return (
    <AnalyticsSurface className={styles.metricHistory} aria-label={title}>
      <header className={styles.metricHistoryHeader}>
        <h2>{title}</h2>
        <SelectField
          label="Métrica"
          value={selectedMetric}
          onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}
        >
          {METRIC_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>{option.label}</option>
          ))}
        </SelectField>
      </header>
      {statusMessage ?? (
        <>
          <MetricHistoryPlot items={items} metric={metric} />
          <p className={styles.metricHistoryCurrent}>
            Mostrando {metric.label.toLocaleLowerCase("es-PE")} a través de los procesos publicados.
          </p>
        </>
      )}
    </AnalyticsSurface>
  );
}
