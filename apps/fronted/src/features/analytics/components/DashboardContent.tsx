import type { ProcessOverview } from "../api/analytics.types";
import type { ReactNode } from "react";
import { ProcessComparisonChart } from "./ProcessComparison";
import { KpiGrid } from "./KpiGrid";
import { MajorDemandChart } from "./MajorDemandChart";
import { getTopMajors } from "./majorDemandRanking.utils";
import { MajorBreakdown } from "./MajorBreakdown";
import styles from "../pages/DashboardPage.module.css";

type DashboardContentProps = {
  primary: ProcessOverview;
  comparisons: ProcessOverview[];
  previous?: ProcessOverview;
  filterControls: ReactNode;
};

export function DashboardContent({
  primary,
  comparisons,
  previous,
  filterControls,
}: DashboardContentProps) {
  return (
    <>
      <KpiGrid overview={primary} previous={previous} />
      <ProcessComparisonChart overviews={[primary, ...comparisons]} />
      <section className={styles.majorFilters} aria-labelledby="career-filters-heading">
        <div className={styles.majorFiltersHeader}>
          <div className={styles.majorFiltersCopy}>
            <h2 id="career-filters-heading">Filtros de carreras</h2>
            <p>Filtrar por área, facultad o modalidad</p>
          </div>
          {filterControls}
        </div>
      </section>
      <MajorDemandChart majors={getTopMajors(primary.majors)} process={primary.process} />
      <MajorBreakdown overview={primary} />
    </>
  );
}
