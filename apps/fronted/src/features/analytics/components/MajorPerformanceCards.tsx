import type { MajorOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

type MajorPerformanceCardsProps = { majors: MajorOverview[] };

function admissionRate(major: MajorOverview) {
  return major.total_results ? (major.admitted_count / major.total_results) * 100 : 0;
}

export function MajorPerformanceCards({ majors }: MajorPerformanceCardsProps) {
  if (!majors.length) {
    return <p className={styles.performanceCardsEmpty}>No hay carreras que coincidan con la búsqueda.</p>;
  }

  return <div className={styles.performanceCards} aria-label="Indicadores por carrera">
    {majors.map((major, index) => <details className={styles.performanceCard} key={major.major_id}>
      <summary>
        <span className={styles.performanceCardRank}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.performanceCardMain}>
          <strong>{major.major_name}</strong>
          <span>{formatNumber(major.total_results)} postulantes · {formatNumber(major.admitted_count)} admitidos</span>
        </span>
        <span className={styles.performanceCardToggle}><span className={styles.performanceCardToggleClosed}>Ver más</span><span className={styles.performanceCardToggleOpen}>Ver menos</span> <span aria-hidden="true">⌄</span></span>
      </summary>
      <dl className={styles.performanceCardDetails}>
        <div><dt>Tasa de admisión</dt><dd>{formatNumber(admissionRate(major), 1)}%</dd></div>
        <div><dt>Ausentes</dt><dd>{formatNumber(major.absent_count)}</dd></div>
        <div><dt>Promedio</dt><dd>{formatNumber(major.average_score, 2)}</dd></div>
      </dl>
    </details>)}
  </div>;
}
