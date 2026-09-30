import type { MajorOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { MajorPerformanceCard } from "./MajorPerformanceCard";

type MajorPerformanceCardsProps = { majors: MajorOverview[]; processId: number };

export function MajorPerformanceCards({ majors, processId }: MajorPerformanceCardsProps) {
  if (!majors.length) {
    return <p className={styles.performanceCardsEmpty}>No hay carreras que coincidan con la búsqueda.</p>;
  }

  return <div className={styles.performanceCards} aria-label="Indicadores por carrera" data-testid="major-performance-cards">
    {majors.map((major, index) => <MajorPerformanceCard key={major.major_id} major={major} rank={index + 1} processId={processId} />)}
  </div>;
}
