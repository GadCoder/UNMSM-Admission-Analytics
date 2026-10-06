import type { DemandChartModel } from "./majorDemandRanking.utils";
import { DemandMapLegend } from "./DemandMapLegend";
import { DemandMapPlot } from "./DemandMapPlot";
import styles from "../pages/DashboardPage.module.css";
import { useDemandMapTooltip } from "./useDemandMapTooltip";

type MajorDemandMatrixProps = DemandChartModel;

export function MajorDemandMatrix({
  points,
  applicantRange,
  admissionRateRange,
}: MajorDemandMatrixProps) {
  const tooltip = useDemandMapTooltip();

  return (
    <div className={styles.demandMapBody}>
      <DemandMapPlot
        points={points}
        applicantRange={applicantRange}
        admissionRateRange={admissionRateRange}
        plotRef={tooltip.plotRef}
        selectedPoint={tooltip.selectedPoint}
        onSelectPoint={tooltip.selectPoint}
        tooltipPosition={tooltip.tooltipPosition}
        tooltipRef={tooltip.tooltipRef}
      />
      <div className={styles.demandMapLegendDesktop}>
        <h4>Carreras representadas</h4>
        <DemandMapLegend points={points} />
      </div>
      <div className={styles.demandMapLegendMobile}>
        <h4>Carreras representadas</h4>
        <DemandMapLegend points={points} />
      </div>
    </div>
  );
}
