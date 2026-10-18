import { Fragment, useLayoutEffect, useMemo, useState, type RefObject } from "react";

import { createDemandPointLabels } from "./demandMapLabels.utils";
import type { DemandChartModel, DemandChartPoint } from "./majorDemandRanking.utils";
import type { TooltipPosition } from "./useDemandMapTooltip";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

const pointLabelPlacementStyles = {
  right: styles.demandMatrixPointLabelRight,
  left: styles.demandMatrixPointLabelLeft,
  above: styles.demandMatrixPointLabelAbove,
  below: styles.demandMatrixPointLabelBelow,
};

type DemandMapPlotProps = Pick<DemandChartModel, "points" | "applicantTicks" | "admissionRateTicks"> & {
  plotRef: RefObject<HTMLDivElement | null>;
  selectedPoint: DemandChartPoint | null;
  activeMajorId: number | null;
  tooltipVisible: boolean;
  onSelectPoint: (point: DemandChartPoint) => void;
  onHoverMajor: (majorId: number | null) => void;
  onMoveTooltip: (majorId: number, clientX: number, clientY: number) => void;
  tooltipPosition: TooltipPosition | null;
  tooltipRef: RefObject<HTMLDivElement | null>;
};

export function DemandMapPlot({
  points,
  applicantTicks,
  admissionRateTicks,
  plotRef,
  selectedPoint,
  activeMajorId,
  tooltipVisible,
  onSelectPoint,
  onHoverMajor,
  onMoveTooltip,
  tooltipPosition,
  tooltipRef,
}: DemandMapPlotProps) {
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    const updateSize = () => {
      const rect = plot.getBoundingClientRect();
      setPlotSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(plot);
    return () => observer.disconnect();
  }, [plotRef]);
  const pointLabels = useMemo(() => createDemandPointLabels(points, plotSize.width, plotSize.height), [points, plotSize]);

  return (
    <div className={styles.demandMatrix} role="group" aria-label="Mapa de postulantes y porcentaje de ingreso por carrera">
      <div className={styles.demandMatrixYAxis}>
        <span className={styles.demandMatrixAxisTitle}>Porcentaje de ingreso (%)</span>
        <div className={styles.demandMatrixYTicks} aria-hidden="true">
          {admissionRateTicks.map((tick, index) => <span key={index} style={{ top: `${92 - index * 21}%` }}>{formatNumber(tick, 1)}%</span>)}
        </div>
      </div>
      <strong className={styles.demandMatrixMobileAxisTitle}>Porcentaje de ingreso (%)</strong>
      <div className={styles.demandMatrixPlot} ref={plotRef}>
        {points.map((point) => {
          const { major, left, bottom, admissionRate } = point;
          const isSelected = selectedPoint?.major.major_id === major.major_id;
          const isActive = activeMajorId === major.major_id;
          const isDimmed = activeMajorId !== null && !isActive;
          const label = pointLabels.get(major.major_id);
          return <Fragment key={major.major_id}>
            <button
              type="button"
              className={`${styles.demandMatrixPoint} ${isActive ? styles.demandMatrixPointSelected : ""} ${isDimmed ? styles.demandMatrixPointDimmed : ""}`}
              style={{ left: `${left}%`, bottom: `${bottom}%` }}
              title={`${major.major_name}: ${formatNumber(major.total_results)} postulantes y ${formatNumber(admissionRate, 1)}% de ingreso`}
              data-major-id={major.major_id}
              aria-label={`Mostrar datos de ${major.major_name}`}
              aria-pressed={isSelected}
              aria-describedby={isSelected && tooltipVisible ? "demand-point-tooltip" : undefined}
              onClick={() => onSelectPoint(point)}
              onPointerEnter={() => onHoverMajor(major.major_id)}
              onPointerLeave={() => onHoverMajor(null)}
              onPointerMove={(event) => onMoveTooltip(major.major_id, event.clientX, event.clientY)}
              onFocus={() => onHoverMajor(major.major_id)}
              onBlur={() => onHoverMajor(null)}
            />
            {label && <button
              type="button"
              className={`${styles.demandMatrixPointLabel} ${pointLabelPlacementStyles[label.placement]}`}
              style={{ left: `${left}%`, bottom: `${bottom}%` }}
              aria-label={`Mostrar datos de ${major.major_name}`}
              aria-pressed={isSelected}
              onClick={() => onSelectPoint(point)}
              onPointerEnter={() => onHoverMajor(major.major_id)}
              onPointerLeave={() => onHoverMajor(null)}
              onFocus={() => onHoverMajor(major.major_id)}
              onBlur={() => onHoverMajor(null)}
            >{label.text}</button>}
          </Fragment>;
        })}
        {selectedPoint && tooltipVisible && <div
          id="demand-point-tooltip"
          role="tooltip"
          ref={tooltipRef}
          className={styles.demandMatrixTooltip}
          style={{
            left: tooltipPosition ? `${tooltipPosition.left}px` : "0px",
            top: tooltipPosition ? `${tooltipPosition.top}px` : "0px",
            visibility: tooltipPosition ? "visible" : "hidden",
          }}
        >
          <strong>{selectedPoint.major.major_name}</strong>
          <span>{formatNumber(selectedPoint.major.total_results)} postulantes · {formatNumber(selectedPoint.admissionRate, 1)}% ingresó</span>
        </div>}
      </div>
      <div className={styles.demandMatrixXAxis}>
        <div className={styles.demandMatrixXTicks} aria-hidden="true">
          {applicantTicks.map((tick, index) => <span key={index}>{formatNumber(tick)}</span>)}
        </div>
        <strong>Postulantes</strong>
      </div>
      {selectedPoint && <div className={styles.demandMatrixDetail} role="status" aria-live="polite">
        <strong>{selectedPoint.major.major_name}</strong>
        <span>{formatNumber(selectedPoint.major.total_results)} postulantes</span>
        <span>{formatNumber(selectedPoint.admissionRate, 1)}% ingresó</span>
      </div>}
    </div>
  );
}
