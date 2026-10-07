import type { ReactNode } from "react";

import styles from "../pages/DashboardPage.module.css";
import { AnalyticsSurface } from "./AnalyticsSurface";

type MajorCareerFiltersProps = {
  controls: ReactNode;
};

export function MajorCareerFilters({ controls }: MajorCareerFiltersProps) {
  return (
    <AnalyticsSurface className={styles.majorFilters} aria-labelledby="career-filters-heading">
      <div className={styles.majorFiltersHeader}>
        <div className={styles.majorFiltersCopy}>
          <h2 id="career-filters-heading">Filtros de carreras</h2>
          <p>Filtrar por área, facultad o modalidad</p>
        </div>
        {controls}
      </div>
    </AnalyticsSurface>
  );
}
