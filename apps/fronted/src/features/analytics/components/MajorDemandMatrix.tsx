import { useState } from "react";
import type { DemandChartModel } from "./majorDemandRanking.utils";
import { DemandMapLegend } from "./DemandMapLegend";
import { DemandMapPlot } from "./DemandMapPlot";
import styles from "../pages/DashboardPage.module.css";
import { useDemandMapTooltip } from "./useDemandMapTooltip";

type MajorDemandMatrixProps = DemandChartModel;

export function MajorDemandMatrix({
  points,
  applicantTicks,
  admissionRateTicks,
}: MajorDemandMatrixProps) {
  const tooltip = useDemandMapTooltip(points);
  const [hoveredMajorId, setHoveredMajorId] = useState<number | null>(null);
  const activeMajorId = hoveredMajorId ?? tooltip.selectedPoint?.major.major_id ?? null;
  const selectMajor = (majorId: number) => {
    const point = points.find((item) => item.major.major_id === majorId);
    if (point) tooltip.selectPoint(point);
  };

  return (
    <div className={styles.demandMapBody}>
      <DemandMapPlot
        points={points}
        applicantTicks={applicantTicks}
        admissionRateTicks={admissionRateTicks}
        plotRef={tooltip.plotRef}
        selectedPoint={tooltip.selectedPoint}
        activeMajorId={activeMajorId}
        tooltipVisible={tooltip.tooltipVisible}
        onSelectPoint={tooltip.selectPoint}
        onHoverMajor={setHoveredMajorId}
        onMoveTooltip={tooltip.moveTooltip}
        tooltipPosition={tooltip.tooltipPosition}
        tooltipRef={tooltip.tooltipRef}
      />
      <div className={styles.demandMapLegendDesktop}>
        <h3>Carreras representadas</h3>
        <DemandMapLegend points={points} activeMajorId={activeMajorId} selectedMajorId={tooltip.selectedPoint?.major.major_id ?? null} onSelectMajor={selectMajor} onHoverMajor={setHoveredMajorId} />
      </div>
      <div className={styles.demandMapLegendMobile}>
        <h3>Carreras representadas</h3>
        <DemandMapLegend points={points} activeMajorId={activeMajorId} selectedMajorId={tooltip.selectedPoint?.major.major_id ?? null} onSelectMajor={selectMajor} onHoverMajor={setHoveredMajorId} />
      </div>
    </div>
  );
}
