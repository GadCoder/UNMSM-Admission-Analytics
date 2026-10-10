import type { ReactNode } from "react";

import styles from "../pages/DashboardPage.module.css";

type MajorCareerFiltersProps = {
  controls: ReactNode;
};

export function MajorCareerFilters({ controls }: MajorCareerFiltersProps) {
  return (
    <div className={styles.majorFilters} role="group" aria-label="Filtros de carreras">
      <div className={styles.majorFiltersHeader}>
        {controls}
      </div>
    </div>
  );
}
