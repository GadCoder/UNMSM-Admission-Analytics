import type { CareerNavigationContext } from "../utils/careerNavigation";
import type { ProcessHistoryItem, ProcessOverview } from "../api/analytics.types";
import { MetricHistoryChart } from "./MetricHistoryChart";
import { ProcessHistory } from "./ProcessHistory";
import { KpiGrid } from "./KpiGrid";
import { MajorDemandChart } from "./MajorDemandChart";
import { getTopMajors } from "./majorDemandRanking.utils";
import { MajorBreakdown } from "./MajorBreakdown";

type DashboardContentProps = {
  primary: ProcessOverview;
  navigation: CareerNavigationContext;
  selectedProcessId: number;
  previous?: ProcessOverview;
  historyItems: ProcessHistoryItem[];
  historyStatus?: "ready" | "loading" | "error";
  onSelectProcess?: (processId: number) => void;
};

export function DashboardContent({
  primary,
  navigation,
  selectedProcessId,
  previous,
  historyItems,
  historyStatus = "ready",
  onSelectProcess,
}: DashboardContentProps) {
  return (
    <>
      <KpiGrid overview={primary} previous={previous} />
      <MetricHistoryChart items={historyItems} title="Evolución histórica" status={historyStatus} />
      <ProcessHistory items={historyItems} selectedProcessId={selectedProcessId} status={historyStatus} onSelectProcess={onSelectProcess} />
      <MajorDemandChart majors={getTopMajors(primary.majors)} />
      <MajorBreakdown overview={primary} navigation={navigation} />
    </>
  );
}
