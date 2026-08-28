import type { AdmissionProcess, ProcessOverview } from "../../shared/api/analytics.types";
import { ComparisonSummary } from "./ComparisonSummary";
import { KpiGrid } from "./KpiGrid";
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
      <MajorBreakdown overview={primary} />
    </>
  );
}
