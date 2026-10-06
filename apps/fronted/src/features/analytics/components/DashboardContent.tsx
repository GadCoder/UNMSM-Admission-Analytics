import type { ProcessOverview } from "../api/analytics.types";
import type { ReactNode } from "react";
import { ProcessComparisonChart } from "./ProcessComparison";
import { KpiGrid } from "./KpiGrid";
import { MajorCareerFilters } from "./MajorCareerFilters";
import { MajorDemandChart } from "./MajorDemandChart";
import { getTopMajors } from "./majorDemandRanking.utils";
import { MajorBreakdown } from "./MajorBreakdown";

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
      <MajorCareerFilters controls={filterControls} />
      <MajorDemandChart majors={getTopMajors(primary.majors)} process={primary.process} />
      <MajorBreakdown overview={primary} />
    </>
  );
}
