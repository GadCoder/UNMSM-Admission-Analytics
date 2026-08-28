import type { AdmissionProcess, ProcessOverview } from "../api/analytics.types";
import { ProcessComparisonChart } from "./AnalyticsCharts";
import { ComparisonSummary } from "./ComparisonSummary";
import { KpiGrid } from "./KpiGrid";
import { MajorDemandRanking } from "./MajorDemandRanking";
import { MajorBreakdown } from "./MajorBreakdown";
import { ProcessHeader } from "./ProcessHeader";

type DashboardContentProps = {
  primary: ProcessOverview;
  comparisons: ProcessOverview[];
  processById: Map<string, AdmissionProcess>;
};

export function DashboardContent({
  primary,
  comparisons,
  processById,
}: DashboardContentProps) {
  return (
    <>
      <ProcessHeader process={primary.process} />
      <KpiGrid overview={primary} />
      <ComparisonSummary
        comparisons={comparisons}
        processById={processById}
      />
      <ProcessComparisonChart overviews={[primary, ...comparisons]} />
      <MajorDemandRanking overview={primary} />
      <MajorBreakdown overview={primary} />
    </>
  );
}
