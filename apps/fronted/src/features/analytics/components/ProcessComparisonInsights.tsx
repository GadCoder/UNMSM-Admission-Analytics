import type { ProcessOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { buildComparisonInsights } from "./processComparisonInsights";

export function ProcessComparisonInsights({ overviews }: { overviews: ProcessOverview[] }) {
  const insights = buildComparisonInsights(overviews);
  return <section className={`${styles.card} ${styles.comparisonInsights}`} aria-label="Cambios destacados">
    <p className={styles.sectionEyebrow}>Cambios destacados</p>
    <div className={styles.insightGrid}>{insights.map((insight) => <article key={insight.metric} className={styles.insightItem}><span aria-hidden="true">{insight.direction === "down" ? "↓" : insight.direction === "up" ? "↑" : "—"}</span><div><h3>{insight.metric}</h3><p>{insight.text}</p></div></article>)}</div>
  </section>;
}
