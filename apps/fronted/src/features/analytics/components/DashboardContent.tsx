import type { ProcessOverview } from "../api/analytics.types";
import type { ReactNode } from "react";
import { ProcessComparisonChart } from "./ProcessComparison";
import { KpiGrid } from "./KpiGrid";
import { KpiEvolution } from "./KpiEvolution";
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
      <KpiEvolution overviews={[primary, ...comparisons]} />
      <MajorBreakdown overview={primary} filterControls={filterControls} />
    </>
  );
}
