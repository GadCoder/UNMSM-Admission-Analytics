import type { ProcessOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { MajorDetailHistory } from "./MajorDetailHistory";

type ComparisonChartProps = {
  overviews: ProcessOverview[];
  onSelectProcess?: (processId: number) => void;
};

function sequenceOrder(sequence: string) {
  const normalized = sequence.trim().toUpperCase();
  const suffix = normalized.slice(normalized.lastIndexOf("-") + 1);
  const romanOrder: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
  const numeric = Number(suffix);
  return romanOrder[suffix] ?? (Number.isFinite(numeric) ? numeric : 0);
}

function compareProcessPeriod(left: ProcessOverview, right: ProcessOverview) {
  return right.process.year - left.process.year
    || sequenceOrder(right.process.sequence) - sequenceOrder(left.process.sequence)
    || right.process.id - left.process.id;
}

export function ProcessComparisonChart({ overviews, onSelectProcess }: ComparisonChartProps) {
  if (overviews.length < 2) return null;

  const history = [...overviews].sort(compareProcessPeriod);
  const primaryProcessId = overviews[0].process.id;

  return (
    <section className={styles.comparisonStack} aria-label="Comparación de procesos">
      <section className={`${styles.card} ${styles.comparisonCard}`} aria-labelledby="comparison-chart-heading">
        <header className={styles.comparisonCardHeader}>
          <div><p className={styles.sectionEyebrow}>Detalle de la comparación</p><h2 id="comparison-chart-heading" className={styles.comparisonSectionTitle}>Valores por proceso</h2></div>
        </header>
        <MajorDetailHistory
          items={history}
          selectedProcessId={primaryProcessId}
          onSelectProcess={onSelectProcess}
        />
      </section>
    </section>
  );
}
