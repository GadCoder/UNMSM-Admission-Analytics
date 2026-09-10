import type { AdmissionProcess, ProcessOverview } from "../api/analytics.types";
import type { ReactNode } from "react";
import { ProcessComparisonChart } from "./AnalyticsCharts";
import { ComparisonSummary } from "./ComparisonSummary";
import { KpiGrid } from "./KpiGrid";
import { MajorDemandRanking } from "./MajorDemandRanking";
import { MajorBreakdown } from "./MajorBreakdown";
import { ProcessHeader } from "./ProcessHeader";

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
      <ProcessHeader process={primary.process} />
      <KpiGrid overview={primary} previous={previous} />
      <ComparisonSummary
        comparisons={comparisons}
        processById={processById}
      />
      <ProcessComparisonChart overviews={[primary, ...comparisons]} />
      <MajorDemandRanking overview={primary} comparisons={comparisons} />
      <MajorBreakdown overview={primary} filterControls={filterControls} />
    </>
  );
}
