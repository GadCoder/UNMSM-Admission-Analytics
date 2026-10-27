import { useMemo, useState } from "react";
import type { AdmissionProcess } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import type { PointerEvent, MouseEvent } from "react";
import { SelectField } from "./SelectField";
import {
  alignCareerHistory,
  CAREER_COMPARISON_METRICS,
  formatCareerComparisonMetric,
  getCareerSeriesStyle,
  getSharedHistoryCoverage,
  getSharedHistoryMinimumInsight,
  useCareerSeriesSlots,
  type CareerComparisonMetricKey,
  type CareerComparisonSeries,
} from "../utils/careerComparison";
import styles from "./CareerComparisonHistory.module.css";

type CareerComparisonHistoryProps = {
  series: CareerComparisonSeries[];
  processes: AdmissionProcess[];
  metric: CareerComparisonMetricKey;
  onMetricChange: (metric: CareerComparisonMetricKey) => void;
  selectedProcessId?: number;
  insightsEnabled?: boolean;
  seriesSlots?: ReadonlyMap<number | string, number>;
};

const WIDTH = 840;
const HEIGHT = 300;
const PAD = { top: 18, right: 22, bottom: 48, left: 70 };
function marker(index: number, x: number, y: number, color: string) {
  switch (index) {
    case 1:
      return (
        <rect
          x={x - 4}
          y={y - 4}
          width="8"
          height="8"
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      );
    case 2:
      return (
        <polygon
          points={`${x},${y - 5} ${x + 5},${y + 4} ${x - 5},${y + 4}`}
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      );
    case 3:
      return (
        <polygon
          points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`}
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      );
    default:
      return <circle cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2" />;
  }
}

function segments(
  values: Array<number | null>,
  xPositions: number[],
  y: (value: number) => number,
) {
  const result: string[] = [];
  let current: string[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length) result.push(current.join(" "));
      current = [];
    } else current.push(`${current.length ? "L" : "M"} ${xPositions[index]} ${y(value)}`);
  });
  if (current.length) result.push(current.join(" "));
  return result;
}

export function CareerComparisonHistory({
  series,
  processes,
  metric,
  onMetricChange,
  selectedProcessId,
  insightsEnabled = true,
  seriesSlots,
}: CareerComparisonHistoryProps) {
  const aligned = useMemo(
    () => alignCareerHistory(series, processes, metric, selectedProcessId),
    [series, processes, metric, selectedProcessId],
  );
  const [hoveredProcess, setHoveredProcess] = useState<{
    contextId: number | null;
    processId: number;
  } | null>(null);
  const [dismissedContextId, setDismissedContextId] = useState<number>(-1);
  const { processes: orderedProcesses, series: orderedSeries } = aligned;
  const activeIndexFromHover =
    hoveredProcess?.contextId === (selectedProcessId ?? null)
      ? orderedProcesses.findIndex((process) => process.id === hoveredProcess.processId)
      : -1;
  const selectedIndex =
    selectedProcessId === undefined
      ? -1
      : orderedProcesses.findIndex((process) => process.id === selectedProcessId);
  const activeIndex =
    activeIndexFromHover >= 0 ? activeIndexFromHover : selectedIndex >= 0 ? selectedIndex : null;
  const contextId = selectedProcessId ?? -3;
  const values = orderedSeries.flatMap((item) =>
    item.values.filter((value): value is number => value !== null),
  );
  const hasValues = values.length > 0;
  const min = hasValues ? Math.min(...values) : 0;
  const max = hasValues ? Math.max(...values) : 1;
  const span = max - min || Math.max(Math.abs(max) * 0.1, 1);
  const boundedMetric =
    metric === "admission_rate" ||
    metric === "total_results" ||
    metric === "admitted_count" ||
    metric === "absent_count" ||
    metric === "applicants_per_admitted";
  const yMin =
    metric === "admission_rate"
      ? 0
      : boundedMetric
        ? Math.max(0, min - span * 0.12)
        : min - span * 0.12;
  const yMax = metric === "admission_rate" ? 100 : Math.max(yMin + 1, max + span * 0.12);
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const xPositions = orderedProcesses.map(
    (_, index) =>
      PAD.left +
      (orderedProcesses.length <= 1
        ? plotWidth / 2
        : (index * plotWidth) / (orderedProcesses.length - 1)),
  );
  const yPosition = (value: number) => PAD.top + ((yMax - value) / (yMax - yMin)) * plotHeight;
  const metricOption = CAREER_COMPARISON_METRICS.find((item) => item.key === metric)!;
  const insight =
    insightsEnabled && metric === "admission_rate" ? getSharedHistoryMinimumInsight(aligned) : null;
  const coverage = getSharedHistoryCoverage(aligned);
  const activeProcess = activeIndex === null ? null : orderedProcesses[activeIndex];

  const localStyleSlots = useCareerSeriesSlots(series.map(({ id }) => id));
  const styleSlots = seriesSlots ?? localStyleSlots;
  const tooltipDismissed = dismissedContextId === contextId;

  function moveActive(direction: number) {
    if (!orderedProcesses.length) return;
    const start = activeIndex ?? 0;
    const next = Math.max(0, Math.min(orderedProcesses.length - 1, start + direction));
    setHoveredProcess({
      contextId: selectedProcessId ?? null,
      processId: orderedProcesses[next].id,
    });
    setDismissedContextId(-1);
  }

  function indexAtPointer(event: PointerEvent<SVGRectElement> | MouseEvent<SVGRectElement>) {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!bounds || !orderedProcesses.length) return;
    const pointX = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
    const closest = xPositions.reduce(
      (best, x, index) =>
        Math.abs(x - pointX) < Math.abs(xPositions[best] - pointX) ? index : best,
      0,
    );
    setHoveredProcess({
      contextId: selectedProcessId ?? null,
      processId: orderedProcesses[closest].id,
    });
    setDismissedContextId(-1);
  }

  return (
    <section className={styles.history} aria-labelledby="career-history-heading">
      <div className={styles.heading}>
        <div>
          <h2 id="career-history-heading">¿Cómo han cambiado los resultados?</h2>
          <p>
            Compara cada carrera en los mismos procesos publicados hasta el proceso seleccionado.
          </p>
        </div>
        <SelectField
          label="Métrica"
          wrapperClassName={styles.metricControl}
          value={metric}
          onChange={(event) => onMetricChange(event.target.value as CareerComparisonMetricKey)}
        >
          {CAREER_COMPARISON_METRICS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </div>
      {insight && (
        <p className={styles.insight}>
          {insight.careerNames.join(" y ")}{" "}
          {insight.careerNames.length > 1 ? "registraron" : "registró"} la menor tasa de ingreso en{" "}
          {insight.uniqueMinimumCount} de {insight.sharedProcessCount} procesos con datos para todas
          las carreras seleccionadas ({insight.period}).
        </p>
      )}
      {insightsEnabled &&
        metric === "admission_rate" &&
        !insight &&
        !coverage.hasMinimumCoverage &&
        series.length >= 2 && (
          <p className={styles.coverageNote}>
            Aún no hay dos procesos con datos para todas las carreras seleccionadas para resumir la
            tasa histórica.
          </p>
        )}
      {series.length > 0 && (
        <ul className={styles.legend} aria-label="Carreras del gráfico">
          {series.map((item) => {
            const style = getCareerSeriesStyle(styleSlots.get(item.id) ?? 0);
            return (
              <li key={item.id}>
                <svg className={styles.legendMark} viewBox="0 0 28 12" aria-hidden="true">
                  <line
                    x1="0"
                    x2="28"
                    y1="6"
                    y2="6"
                    stroke={style.color}
                    strokeWidth="2"
                    strokeDasharray={style.dash}
                  />
                  {marker(style.markerIndex, 14, 6, style.color)}
                </svg>
                {item.label}
              </li>
            );
          })}
        </ul>
      )}
      {!hasValues ? (
        <p className={styles.empty} role="status">
          No hay datos históricos disponibles para esta métrica.
        </p>
      ) : (
        <div className={styles.chartScroller}>
          <svg
            className={styles.chart}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="group"
            aria-label={`${metricOption.label} por proceso para las carreras seleccionadas`}
          >
            {[0, 1, 2, 3].map((step) => {
              const value = yMax - (step * (yMax - yMin)) / 3;
              const y = PAD.top + (step * plotHeight) / 3;
              return (
                <g key={step}>
                  <line
                    x1={PAD.left}
                    x2={WIDTH - PAD.right}
                    y1={y}
                    y2={y}
                    className={styles.gridLine}
                  />
                  <text x={PAD.left - 10} y={y + 4} textAnchor="end" className={styles.axisLabel}>
                    {formatCareerComparisonMetric(value, metric)}
                  </text>
                </g>
              );
            })}
            {orderedProcesses.map((process, index) => (
              <g key={process.id}>
                <line
                  x1={xPositions[index]}
                  x2={xPositions[index]}
                  y1={PAD.top}
                  y2={HEIGHT - PAD.bottom}
                  className={activeIndex === index ? styles.activeGuide : styles.guide}
                />
                {(orderedProcesses.length <= 12 ||
                  index === 0 ||
                  index === orderedProcesses.length - 1 ||
                  index === activeIndex ||
                  index % Math.ceil(orderedProcesses.length / 12) === 0) && (
                  <text
                    x={xPositions[index]}
                    y={HEIGHT - 20}
                    textAnchor="middle"
                    className={styles.axisLabel}
                  >
                    {formatProcessLabel(process)}
                  </text>
                )}
              </g>
            ))}
            {orderedSeries.map((item) => {
              const style = getCareerSeriesStyle(styleSlots.get(item.id) ?? 0);
              const color = style.color;
              const paths = segments(item.values, xPositions, yPosition);
              return (
                <g key={item.id} aria-label={item.label}>
                  {paths.map((path, index) => (
                    <path
                      key={index}
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeDasharray={style.dash}
                    />
                  ))}
                  {item.values.map((value, index) =>
                    value === null ? null : (
                      <g key={orderedProcesses[index].id}>
                        {marker(style.markerIndex, xPositions[index], yPosition(value), color)}
                      </g>
                    ),
                  )}
                </g>
              );
            })}
            <rect
              x={PAD.left}
              y={PAD.top}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              role="slider"
              tabIndex={0}
              aria-label="Proceso histórico"
              aria-valuemin={1}
              aria-valuemax={Math.max(1, orderedProcesses.length)}
              aria-valuenow={(activeIndex ?? 0) + 1}
              aria-valuetext={
                activeProcess
                  ? formatProcessLabel(activeProcess)
                  : "Usa las flechas izquierda y derecha para elegir un proceso"
              }
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveActive(-1);
                } else if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveActive(1);
                } else if (event.key === "Enter") setDismissedContextId(-1);
                else if (event.key === "Escape") setDismissedContextId(contextId);
              }}
              onPointerMove={indexAtPointer}
              onPointerDown={indexAtPointer}
              onClick={indexAtPointer}
            />
          </svg>
        </div>
      )}
      {hasValues && activeProcess && !tooltipDismissed && (
        <div className={styles.tooltip} role="status" aria-live="polite">
          <strong>{formatProcessLabel(activeProcess)}</strong>
          <ul>
            {orderedSeries.map((item) => {
              const value = item.values[activeIndex!];
              return (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <strong>
                    {value === null ? "Sin datos" : formatCareerComparisonMetric(value, metric)}
                  </strong>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {orderedProcesses.length > 0 && (
        <details className={styles.tableDisclosure}>
          <summary>Ver tabla de datos históricos</summary>
          <div
            className={styles.tableScroller}
            role="region"
            aria-label="Tabla de datos históricos"
            tabIndex={0}
          >
            <table>
              <caption>{metricOption.label} por carrera y proceso</caption>
              <thead>
                <tr>
                  <th scope="col">Proceso</th>
                  {series.map((item) => (
                    <th scope="col" key={item.id}>
                      {item.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderedProcesses.map((process, index) => (
                  <tr key={process.id}>
                    <th scope="row">{formatProcessLabel(process)}</th>
                    {orderedSeries.map((item) => (
                      <td key={item.id}>
                        {item.values[index] === null
                          ? "Sin datos"
                          : formatCareerComparisonMetric(item.values[index], metric)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
