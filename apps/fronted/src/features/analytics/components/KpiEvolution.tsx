import { useId, useState } from "react";

import type { ProcessOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { KpiEvolutionChart } from "./KpiEvolutionChart";
import { kpiMetrics, type MetricKey } from "./kpiEvolutionMetrics";

type KpiEvolutionProps = { overviews: ProcessOverview[] };

export function KpiEvolution({ overviews }: KpiEvolutionProps) {
  const [metricKey, setMetricKey] = useState<MetricKey>("applicants");
  const titleId = useId();
  const metric = kpiMetrics[metricKey];

  return (
    <section className={`${styles.card} ${styles.evolutionCard}`} aria-labelledby={titleId}>
      <header className={styles.evolutionHeader}>
        <div>
          <h2 id={titleId}>Comparación por procesos</h2>
          <p>Selecciona una métrica para comparar sus valores entre procesos.</p>
        </div>
        <label className={styles.evolutionSelect}>
          <span>Métrica</span>
          <select value={metricKey} onChange={(event) => setMetricKey(event.target.value as MetricKey)}>
            {Object.entries(kpiMetrics).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}
          </select>
        </label>
      </header>
      <KpiEvolutionChart overviews={overviews} metric={metric} titleId={titleId} />
    </section>
  );
}
