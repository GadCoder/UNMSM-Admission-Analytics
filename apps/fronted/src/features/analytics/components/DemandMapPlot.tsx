import type { RefObject } from "react";

import type { DemandChartModel, DemandChartPoint } from "./majorDemandRanking.utils";
import type { TooltipPosition } from "./useDemandMapTooltip";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

const QUADRANTS = [
  { position: styles.demandMatrixQuadrantTopLeft, demand: "Menos postulantes", admission: "Ingresa un mayor porcentaje" },
  { position: styles.demandMatrixQuadrantTopRight, demand: "Más postulantes", admission: "Ingresa un mayor porcentaje" },
  { position: styles.demandMatrixQuadrantBottomLeft, demand: "Menos postulantes", admission: "Ingresa un menor porcentaje" },
  { position: styles.demandMatrixQuadrantBottomRight, demand: "Más postulantes", admission: "Ingresa un menor porcentaje" },
];

type DemandMapPlotProps = Pick<DemandChartModel, "points" | "applicantRange" | "admissionRateRange"> & {
  plotRef: RefObject<HTMLDivElement | null>;
  selectedPoint: DemandChartPoint | null;
  onSelectPoint: (point: DemandChartPoint) => void;
  tooltipPosition: TooltipPosition | null;
  tooltipRef: RefObject<HTMLDivElement | null>;
};

export function DemandMapPlot({
  points,
  applicantRange,
  admissionRateRange,
  plotRef,
  selectedPoint,
  onSelectPoint,
  tooltipPosition,
  tooltipRef,
}: DemandMapPlotProps) {
  return (
    <>
    <div className={styles.demandMatrix} role="group" aria-label="Mapa de demanda y tasa de ingreso por carrera">
      <div className={styles.demandMatrixYAxis} aria-hidden="true">
        <span>{formatNumber(admissionRateRange.max, 1)}%</span>
        <span>Postulantes que ingresaron (%)</span>
        <span>{formatNumber(admissionRateRange.min, 1)}%</span>
      </div>
      <div className={styles.demandMatrixPlot} ref={plotRef}>
        {QUADRANTS.map(({ position, demand, admission }) => <span key={position} className={`${styles.demandMatrixQuadrant} ${position}`}>{demand}<br />{admission}</span>)}
        {points.map((point) => {
          const { major, rank, left, bottom, admissionRate } = point;
          const isSelected = selectedPoint?.major.major_id === major.major_id;
          return <button
            key={major.major_id}
            type="button"
            className={`${styles.demandMatrixPoint} ${isSelected ? styles.demandMatrixPointSelected : ""}`}
            style={{ left: `${left}%`, bottom: `${bottom}%` }}
            title={`${major.major_name}: ${formatNumber(major.total_results)} postulantes y ${formatNumber(admissionRate, 1)}% de ingresantes`}
            data-major-id={major.major_id}
            aria-label={`Mostrar datos de ${major.major_name}`}
            aria-pressed={isSelected}
            aria-describedby={isSelected ? "demand-point-tooltip" : undefined}
            onClick={() => onSelectPoint(point)}
          >
            {String(rank).padStart(2, "0")}
          </button>;
        })}
        {selectedPoint && <div
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
          <span>{formatNumber(selectedPoint.major.total_results)} postulantes · {formatNumber(selectedPoint.admissionRate, 1)}% de ingresantes</span>
        </div>}
      </div>
      <div className={styles.demandMatrixXAxis} aria-hidden="true">
        <span>{formatNumber(applicantRange.min)} postulantes</span>
        <strong>Número de postulantes</strong>
        <span>{formatNumber(applicantRange.max)} postulantes</span>
      </div>
    </div>
      <div className={styles.demandMatrixQuadrantGuide} role="group" aria-label="Lectura de los cuadrantes">
        {QUADRANTS.map(({ position, demand, admission }) => <span key={position}><strong>{demand}</strong><br />{admission}</span>)}
      </div>
    </>
  );
}
