import type { AdmissionProcess } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import {
  formatCareerComparisonMetric,
  getCareerSeriesStyle,
  type AlignedCareerHistory,
  type CareerComparisonMetricKey,
} from "../utils/careerComparison";
import { marker, segments } from "./careerHistoryDrawing";
import styles from "./CareerComparisonHistory.module.css";

type PlotGeometry = {
  width: number;
  height: number;
  padLeft: number;
  pad: { top: number; right: number; bottom: number };
  tickValues: number[];
  admissionRatePrecision: number;
  xPositions: number[];
  xLabelStep: number;
  yPosition: (value: number) => number;
};
type PlotInteraction = {
  onMoveActive: (direction: number) => void;
  onSetPinnedProcess: (processId: number) => void;
  onClearPinnedProcess: () => void;
  onPointerLeave: () => void;
  onPointerIndex: (
    event: React.PointerEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>,
  ) => void;
};
type CareerHistoryPlotProps = {
  geometry: PlotGeometry;
  interaction: PlotInteraction;
  metric: CareerComparisonMetricKey;
  metricLabel: string;
  processes: AdmissionProcess[];
  plottedSeries: AlignedCareerHistory["series"];
  styleSlots: ReadonlyMap<number | string, number>;
  activeIndex: number | null;
  activeCareerId: number | string | null;
};

export function CareerHistoryPlot({
  geometry: {
    width,
    height,
    padLeft,
    pad,
    tickValues,
    admissionRatePrecision,
    xPositions,
    xLabelStep,
    yPosition,
  },
  interaction: {
    onMoveActive,
    onSetPinnedProcess,
    onClearPinnedProcess,
    onPointerLeave,
    onPointerIndex,
  },
  metric,
  metricLabel,
  processes,
  plottedSeries,
  styleSlots,
  activeIndex,
  activeCareerId,
}: CareerHistoryPlotProps) {
  const activeProcess = activeIndex === null ? null : processes[activeIndex];
  const plotWidth = width - padLeft - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="group"
      aria-label={`${metricLabel} por proceso para las carreras seleccionadas`}
    >
      {tickValues.map((value) => {
        const y = yPosition(value);
        return (
          <g key={value}>
            <line x1={padLeft} x2={width - pad.right} y1={y} y2={y} className={styles.gridLine} />
            <text x={padLeft - 8} y={y + 4} textAnchor="end" className={styles.axisLabel}>
              {formatCareerComparisonMetric(
                value,
                metric,
                metric === "admission_rate" ? admissionRatePrecision : undefined,
              )}
            </text>
          </g>
        );
      })}
      {processes.map((process, index) => (
        <g key={process.id}>
          <line
            x1={xPositions[index]}
            x2={xPositions[index]}
            y1={pad.top}
            y2={height - pad.bottom}
            className={activeIndex === index ? styles.activeGuide : styles.guide}
          />
          {(index === 0 ||
            index === processes.length - 1 ||
            index === activeIndex ||
            index % xLabelStep === 0) && (
            <text
              x={xPositions[index]}
              y={height - 20}
              textAnchor="middle"
              className={styles.axisLabel}
            >
              {formatProcessLabel(process)}
            </text>
          )}
        </g>
      ))}
      {plottedSeries.map((item) => {
        const style = getCareerSeriesStyle(styleSlots.get(item.id) ?? 0);
        return (
          <g
            key={item.id}
            aria-label={item.label}
            className={
              activeCareerId === null
                ? undefined
                : activeCareerId === item.id
                  ? styles.highlightedSeries
                  : styles.dimmedSeries
            }
          >
            {segments(item.values, xPositions, yPosition).map((path, index) => (
              <path
                key={index}
                d={path}
                fill="none"
                stroke={style.color}
                strokeWidth="2.5"
                strokeDasharray={style.dash}
              />
            ))}
            {item.values.map((value, index) =>
              value === null ? null : (
                <g key={processes[index].id}>
                  {marker(style.markerIndex, xPositions[index], yPosition(value), style.color)}
                </g>
              ),
            )}
          </g>
        );
      })}
      <rect
        x={padLeft}
        y={pad.top}
        width={plotWidth}
        height={plotHeight}
        fill="transparent"
        role="slider"
        tabIndex={0}
        aria-label="Proceso histórico"
        aria-valuemin={1}
        aria-valuemax={Math.max(1, processes.length)}
        aria-valuenow={(activeIndex ?? 0) + 1}
        aria-describedby="history-chart-instructions"
        aria-valuetext={
          activeProcess
            ? formatProcessLabel(activeProcess)
            : "Usa las flechas izquierda y derecha para elegir un proceso"
        }
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            onMoveActive(-1);
          } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            onMoveActive(1);
          } else if (event.key === "Home") {
            event.preventDefault();
            onSetPinnedProcess(processes[0].id);
          } else if (event.key === "End") {
            event.preventDefault();
            onSetPinnedProcess(processes[processes.length - 1].id);
          } else if (event.key === "Enter")
            onSetPinnedProcess(activeProcess?.id ?? processes[0].id);
          else if (event.key === "Escape") onClearPinnedProcess();
        }}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerIndex}
        onPointerDown={onPointerIndex}
        onClick={onPointerIndex}
      />
    </svg>
  );
}
