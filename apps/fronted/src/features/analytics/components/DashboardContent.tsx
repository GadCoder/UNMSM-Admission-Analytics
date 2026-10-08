import type { ProcessHistoryItem, ProcessOverview } from "../api/analytics.types";
import type { ReactNode } from "react";
import { MetricHistoryChart } from "./MetricHistoryChart";
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
  historyItems: ProcessHistoryItem[];
  historyStatus?: "ready" | "loading" | "error";
};

export function DashboardContent({
  primary,
  comparisons,
  previous,
  filterControls,
  historyItems,
  historyStatus = "ready",
}: DashboardContentProps) {
  return (
    <>
      <MajorCareerFilters controls={filterControls} />
      <KpiGrid overview={primary} previous={previous} />
      <MetricHistoryChart items={historyItems} title="Evolución histórica" status={historyStatus} />
      <ProcessComparisonChart overviews={[primary, ...comparisons]} />
      <MajorDemandChart majors={getTopMajors(primary.majors)} process={primary.process} />
      <MajorBreakdown overview={primary} />
    </>
  );
}
