import type { MajorOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { MajorPerformanceCard } from "./MajorPerformanceCard";

type MajorPerformanceCardsProps = { majors: MajorOverview[]; processId: number; modality?: string; rankOffset?: number };

export function MajorPerformanceCards({ majors, processId, modality, rankOffset = 0 }: MajorPerformanceCardsProps) {
  if (!majors.length) {
    return <p className={styles.performanceCardsEmpty}>No hay carreras que coincidan con la búsqueda.</p>;
  }

  return <div className={styles.performanceCards} aria-label="Indicadores por carrera" data-testid="major-performance-cards">
    {majors.map((major, index) => <MajorPerformanceCard key={major.major_id} major={major} rank={rankOffset + index + 1} processId={processId} modality={modality} />)}
  </div>;
}
