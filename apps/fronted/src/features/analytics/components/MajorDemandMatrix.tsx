import { useLayoutEffect, useRef, useState } from "react";
import type { DemandChartModel, DemandChartPoint } from "./majorDemandRanking.utils";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

type MajorDemandMatrixProps = DemandChartModel;

type DemandMapLegendProps = Pick<DemandChartModel, "points">;

function DemandMapLegend({ points }: DemandMapLegendProps) {
  return <ol>
    {points.map(({ major, rank, admissionRate }) => (
      <li key={major.major_id}>
        <span>{String(rank).padStart(2, "0")}</span>
        <strong>{major.major_name}</strong>
        <small>
          <span>{formatNumber(major.total_results)} postulantes</span>
          <span>{formatNumber(admissionRate, 1)}% de ingresantes</span>
        </small>
      </li>
    ))}
  </ol>;
}

type TooltipPosition = { left: number; top: number };

const TOOLTIP_GAP = 8;
const TOOLTIP_INSET = 4;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function MajorDemandMatrix({
  points,
  applicantRange,
  admissionRateRange,
}: MajorDemandMatrixProps) {
  const [selectedPoint, setSelectedPoint] = useState<DemandChartPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!selectedPoint || !plotRef.current || !tooltipRef.current) return;

    const plot = plotRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const selected = plotRef.current.querySelector<HTMLButtonElement>(`[data-major-id="${selectedPoint.major.major_id}"]`);
    if (!selected) return;

    const selectedRect = selected.getBoundingClientRect();
    const pointLeft = selectedRect.left - plot.left;
    const pointTop = selectedRect.top - plot.top;
    const candidates = [
      { left: pointLeft + selectedRect.width + TOOLTIP_GAP, top: pointTop - tooltip.height - TOOLTIP_GAP },
      { left: pointLeft + selectedRect.width + TOOLTIP_GAP, top: pointTop + selectedRect.height + TOOLTIP_GAP },
      { left: pointLeft - tooltip.width - TOOLTIP_GAP, top: pointTop - tooltip.height - TOOLTIP_GAP },
      { left: pointLeft - tooltip.width - TOOLTIP_GAP, top: pointTop + selectedRect.height + TOOLTIP_GAP },
      { left: pointLeft + selectedRect.width + TOOLTIP_GAP, top: pointTop + (selectedRect.height - tooltip.height) / 2 },
      { left: pointLeft - tooltip.width - TOOLTIP_GAP, top: pointTop + (selectedRect.height - tooltip.height) / 2 },
    ];
    const best = candidates
      .map((candidate, index) => {
        const overflow = Math.max(0, -candidate.left) + Math.max(0, -candidate.top)
          + Math.max(0, candidate.left + tooltip.width - plot.width)
          + Math.max(0, candidate.top + tooltip.height - plot.height);
        return { ...candidate, score: overflow * 1000 + index };
      })
      .sort((left, right) => left.score - right.score)[0];

    setTooltipPosition({
      left: clamp(best.left, TOOLTIP_INSET, plot.width - tooltip.width - TOOLTIP_INSET),
      top: clamp(best.top, TOOLTIP_INSET, plot.height - tooltip.height - TOOLTIP_INSET),
    });
  }, [selectedPoint]);

  return (
    <div className={styles.demandMapBody}>
      <div
        className={styles.demandMatrix}
        role="group"
        aria-label="Mapa de demanda y tasa de ingreso por carrera"
      >
        <div className={styles.demandMatrixYAxis} aria-hidden="true">
          <span>{formatNumber(admissionRateRange.max, 1)}%</span>
          <span>Porcentaje de ingresantes</span>
          <span>{formatNumber(admissionRateRange.min, 1)}%</span>
        </div>
        <div className={styles.demandMatrixPlot} ref={plotRef}>
          <span className={`${styles.demandMatrixQuadrant} ${styles.demandMatrixQuadrantTopLeft}`}>Menor demanda<br />mayor ingreso</span>
          <span className={`${styles.demandMatrixQuadrant} ${styles.demandMatrixQuadrantBottomRight}`}>Mayor demanda<br />menor ingreso</span>
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
              onClick={() => {
                setTooltipPosition(null);
                setSelectedPoint(point);
              }}
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
          <strong>Demanda entre las carreras representadas</strong>
          <span>{formatNumber(applicantRange.max)} postulantes</span>
        </div>
      </div>
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
