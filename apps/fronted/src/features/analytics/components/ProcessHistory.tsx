import type { ProcessHistoryItem } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import surfaceStyles from "./AnalyticsSurface.module.css";
import { MajorDetailHistory } from "./MajorDetailHistory";

type ProcessHistoryProps = {
  items: ProcessHistoryItem[];
  selectedProcessId: number;
  status?: "ready" | "loading" | "error";
  onSelectProcess?: (processId: number) => void;
};

function sequenceOrder(sequence: string) {
  const normalized = sequence.trim().toUpperCase();
  const suffix = normalized.slice(normalized.lastIndexOf("-") + 1);
  const romanOrder: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
  const numeric = Number(suffix);
  return romanOrder[suffix] ?? (Number.isFinite(numeric) ? numeric : 0);
}

function compareProcessPeriod(left: ProcessHistoryItem, right: ProcessHistoryItem) {
  return right.process.year - left.process.year
    || sequenceOrder(right.process.sequence) - sequenceOrder(left.process.sequence)
    || right.process.id - left.process.id;
}

export function ProcessHistory({ items, selectedProcessId, status = "ready", onSelectProcess }: ProcessHistoryProps) {
  const history = [...items].sort(compareProcessPeriod);

  return (
    <section className={`${styles.card} ${styles.comparisonCard}`} aria-labelledby="process-history-heading" aria-busy={status === "loading"}>
      <header className={styles.comparisonCardHeader}>
        <h2 id="process-history-heading" className={surfaceStyles.sectionTitle}>Resultados históricos</h2>
      </header>
      {status === "loading" ? <p role="status" className={styles.historyState}>Cargando resultados históricos…</p>
        : status === "error" ? <p role="alert" className={styles.historyState}>No pudimos cargar los resultados históricos.</p>
        : history.length === 0 ? <p className={styles.historyState}>Aún no hay resultados históricos disponibles.</p>
        : <MajorDetailHistory items={history} selectedProcessId={selectedProcessId} initialProcessCount={3} onSelectProcess={onSelectProcess} />}
    </section>
  );
}
