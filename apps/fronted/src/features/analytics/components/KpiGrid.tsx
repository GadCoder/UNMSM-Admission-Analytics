import { useId } from "react";

import type { ProcessOverview } from "../api/analytics.types";
import { AnalyticsSurface } from "./AnalyticsSurface";
import { Kpi } from "./Kpi";
import { averageScoreNote, buildKpiGridModel } from "./kpiGrid.model";
import surfaceStyles from "./AnalyticsSurface.module.css";
import styles from "../pages/DashboardPage.module.css";

type KpiGridProps = {
  overview: ProcessOverview;
  previous?: ProcessOverview;
  variant?: "process" | "career";
};

export function KpiGrid({ overview, previous, variant = "process" }: KpiGridProps) {
  const career = variant === "career";
  const headingId = useId();
  const averageNoteId = useId();
  const { metrics, previousLabel } = buildKpiGridModel(overview, previous, variant, averageNoteId);

  const grid = (
    <div
      className={`${styles.kpis} ${styles.processKpiGrid}`}
      role="group"
      aria-label={career ? "Indicadores de la carrera" : "Indicadores del proceso"}
    >
      {metrics.map((metric) => (
        <Kpi key={metric.label} {...metric} />
      ))}
    </div>
  );

  const footnote = (
    <p id={averageNoteId} className={styles.kpiFootnote}>
      <span aria-hidden="true">* </span>
      {averageScoreNote}
    </p>
  );

  return (
    <AnalyticsSurface className={styles.processKpiSection} aria-labelledby={headingId}>
      <header className={styles.processKpiHeader}>
        <h2 id={headingId} className={surfaceStyles.sectionTitle}>
          {career ? "Resumen de la carrera" : "Resumen del proceso"}
        </h2>
        {previous && (
          <p className={styles.kpiComparisonContext}>Variaciones respecto a {previousLabel}</p>
        )}
      </header>
      {grid}
      {footnote}
    </AnalyticsSurface>
  );
}
