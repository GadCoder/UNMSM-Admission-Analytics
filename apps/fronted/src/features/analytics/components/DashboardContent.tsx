import type { AdmissionProcess, ProcessOverview } from "../api/analytics.types";
import type { ReactNode } from "react";
import { ProcessComparisonChart } from "./ProcessComparison";
import { ComparisonSummary } from "./ComparisonSummary";
import { KpiGrid } from "./KpiGrid";
import { MajorBreakdown } from "./MajorBreakdown";

type DashboardContentProps = {
  primary: ProcessOverview;
  comparisons: ProcessOverview[];
  previous?: ProcessOverview;
  processById: Map<string, AdmissionProcess>;
  filterControls: ReactNode;
};

export function DashboardContent({
  primary,
  comparisons,
  previous,
  processById,
  filterControls,
}: DashboardContentProps) {
  return (
    <>
      <KpiGrid overview={primary} previous={previous} />
      <ComparisonSummary
        comparisons={comparisons}
        processById={processById}
      />
      <ProcessComparisonChart overviews={[primary, ...comparisons]} />
      <MajorBreakdown overview={primary} filterControls={filterControls} />
    </>
  );
}
