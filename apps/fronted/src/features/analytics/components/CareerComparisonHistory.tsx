import { useEffect, useMemo, useRef, useState } from "react";
import type { AdmissionProcess } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import type { PointerEvent, MouseEvent } from "react";
import { SelectField } from "./SelectField";
import {
  alignCareerHistory,
  buildCareerHistoryInsight,
  CAREER_COMPARISON_METRICS,
  formatCareerComparisonMetric,
  getCareerHistoryDomain,
  getCareerSeriesStyle,
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
  loading?: boolean;
  failed?: boolean;
  expectedCareers?: Array<{ id: number | string; label: string }>;
};

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
  loading = false,
  failed = false,
  expectedCareers = [],
}: CareerComparisonHistoryProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const chartHostRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(640);
  const WIDTH = chartWidth;
  const PAD_LEFT = Math.min(PAD.left, Math.max(38, WIDTH * 0.14));
  const aligned = useMemo(
    () => alignCareerHistory(series, processes, metric, selectedProcessId),
    [series, processes, metric, selectedProcessId],
  );
  const [hoveredProcess, setHoveredProcess] = useState<{
    contextId: number | null;
    processId: number;
  } | null>(null);
  const [pinnedProcess, setPinnedProcess] = useState<{
    contextId: number | null;
    processId: number;
  } | null>(null);
  const [hoveredCareerId, setHoveredCareerId] = useState<number | string | null>(null);
  const [pinnedCareerId, setPinnedCareerId] = useState<number | string | null>(null);
  const { processes: orderedProcesses, series: orderedSeries } = aligned;
  const effectivePinnedCareerId = orderedSeries.some((item) => item.id === pinnedCareerId)
    ? pinnedCareerId
    : null;
  const effectiveHoveredCareerId = orderedSeries.some((item) => item.id === hoveredCareerId)
    ? hoveredCareerId
    : null;
  const activeCareerId = effectivePinnedCareerId ?? effectiveHoveredCareerId;
  const plottedSeries =
    activeCareerId === null
      ? orderedSeries
      : [
          ...orderedSeries.filter((item) => item.id !== activeCareerId),
          ...orderedSeries.filter((item) => item.id === activeCareerId),
        ];
  const activeIndexFromHover =
    hoveredProcess?.contextId === (selectedProcessId ?? null)
      ? orderedProcesses.findIndex((process) => process.id === hoveredProcess.processId)
      : -1;
  const selectedIndex =
    selectedProcessId === undefined
      ? -1
      : orderedProcesses.findIndex((process) => process.id === selectedProcessId);
  const activeIndex =
    activeIndexFromHover >= 0
      ? activeIndexFromHover
      : pinnedProcess?.contextId === (selectedProcessId ?? null)
        ? orderedProcesses.findIndex((process) => process.id === pinnedProcess.processId)
        : selectedIndex >= 0
          ? selectedIndex
          : null;
  const panelIndex =
    activeIndexFromHover >= 0
      ? activeIndexFromHover
      : pinnedProcess?.contextId === (selectedProcessId ?? null)
        ? orderedProcesses.findIndex((process) => process.id === pinnedProcess.processId)
        : null;
  const contextId = selectedProcessId ?? null;
  const values = orderedSeries.flatMap((item) =>
    item.values.filter((value): value is number => value !== null && Number.isFinite(value)),
  );
  const hasValues = values.length > 0;
  useEffect(() => {
    const host = chartHostRef.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setChartWidth(Math.max(240, Math.round(entry.contentRect.width)));
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [hasValues, view]);
  const domain = getCareerHistoryDomain(aligned, metric);
  const { min: yMin, max: yMax } = domain;
  const rateTickStep =
    metric === "admission_rate" && domain.ticks.length > 1
      ? Math.abs(domain.ticks[0] - domain.ticks[1])
      : 1;
  const admissionRatePrecision = Math.min(2, Math.max(0, Math.ceil(-Math.log10(rateTickStep)) + 1));
  const plotWidth = WIDTH - PAD_LEFT - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const xPositions = orderedProcesses.map(
    (_, index) =>
      PAD_LEFT +
      (orderedProcesses.length <= 1
        ? plotWidth / 2
        : (index * plotWidth) / (orderedProcesses.length - 1)),
  );
  const xLabelStep = Math.max(
    1,
    Math.ceil(((orderedProcesses.length - 1) * 65) / Math.max(1, plotWidth)),
  );
  const yPosition = (value: number) => PAD.top + ((yMax - value) / (yMax - yMin)) * plotHeight;
  const metricOption = CAREER_COMPARISON_METRICS.find((item) => item.key === metric)!;
  const insight = insightsEnabled ? buildCareerHistoryInsight(aligned, metric) : null;
  const activeProcess = activeIndex === null ? null : orderedProcesses[activeIndex];

  const localStyleSlots = useCareerSeriesSlots(series.map(({ id }) => id));
  const styleSlots = seriesSlots ?? localStyleSlots;
  function moveActive(direction: number) {
    if (!orderedProcesses.length) return;
    const start = activeIndex ?? 0;
    const next = Math.max(0, Math.min(orderedProcesses.length - 1, start + direction));
    setPinnedProcess({
      contextId: selectedProcessId ?? null,
      processId: orderedProcesses[next].id,
    });
  }

  function indexAtPointer(event: PointerEvent<SVGRectElement> | MouseEvent<SVGRectElement>) {
    const svg = event.currentTarget.ownerSVGElement;
    const point = svg?.createSVGPoint?.();
    const matrix = svg?.getScreenCTM?.();
    if (!svg || !orderedProcesses.length) return;
    let pointX: number;
    if (point && matrix) {
      point.x = event.clientX;
      point.y = event.clientY;
      pointX = point.matrixTransform(matrix.inverse()).x;
    } else {
      const bounds = svg.getBoundingClientRect();
      if (!bounds.width) return;
      pointX = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
    }
    const closest = xPositions.reduce(
      (best, x, index) =>
        Math.abs(x - pointX) < Math.abs(xPositions[best] - pointX) ? index : best,
      0,
    );
    setHoveredProcess({
      contextId: selectedProcessId ?? null,
      processId: orderedProcesses[closest].id,
    });
    if (event.type === "pointerdown" || event.type === "click")
      setPinnedProcess({
        contextId: selectedProcessId ?? null,
        processId: orderedProcesses[closest].id,
      });
  }

  return (
    <section className={styles.history} aria-labelledby="career-history-heading">
      <div className={styles.heading}>
        <div>
          <h2 id="career-history-heading">Evolución histórica</h2>
          <p>Compara cómo han cambiado los resultados entre procesos de admisión.</p>
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
      <div className={styles.viewToggle} role="group" aria-label="Vista de resultados históricos">
        <button
          type="button"
          className={styles.viewButton}
          aria-pressed={view === "chart"}
          onClick={() => setView("chart")}
        >
          Gráfico
        </button>
        <button
          type="button"
          className={styles.viewButton}
          aria-pressed={view === "table"}
          onClick={() => setView("table")}
        >
          Tabla
        </button>
      </div>
      {insightsEnabled && (
        <div className={styles.insight}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.insightIcon}>
            <path
              d="M3 7h14m0 0-3-3m3 3-3 3M17 13H3m0 0 3 3m-3-3 3-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <strong>Cambio destacado</strong>
            <p>
              {insight?.text ??
                (orderedProcesses.length < 2 || !hasValues
                  ? "Aún no hay suficientes observaciones para comparar procesos."
                  : "No hay un cambio destacado entre los procesos disponibles.")}
            </p>
          </div>
        </div>
      )}
      {view === "chart" && (series.length > 0 || expectedCareers.length > 0) && (
        <ul className={styles.legend} aria-label="Carreras del gráfico">
          {(expectedCareers.length
            ? expectedCareers.map(
                (expected) => series.find((item) => item.id === expected.id) ?? expected,
              )
            : series
          ).map((item) => {
            const style = getCareerSeriesStyle(styleSlots.get(item.id) ?? 0);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={styles.legendButton}
                  aria-pressed={effectivePinnedCareerId === item.id}
                  onPointerEnter={() => setHoveredCareerId(item.id)}
                  onPointerLeave={() => setHoveredCareerId(null)}
                  onFocus={() => setHoveredCareerId(item.id)}
                  onBlur={() => setHoveredCareerId(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setPinnedCareerId(null);
                      setHoveredCareerId(null);
                    }
                  }}
                  onClick={() => {
                    setPinnedCareerId((current) => (current === item.id ? null : item.id));
                    setHoveredCareerId(null);
                  }}
                >
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
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {view === "chart" && loading && (
        <p className={styles.requestStatus} role="status">
          Cargando datos históricos…
        </p>
      )}
      {view === "chart" && failed && (
        <p className={styles.requestStatus} role="status">
          No se pudieron cargar todos los datos históricos.
        </p>
      )}
      {view === "chart" &&
        (!hasValues && !loading && !failed ? (
          <p className={styles.empty} role="status">
            No hay datos históricos disponibles para esta métrica.
          </p>
        ) : hasValues ? (
          <div className={styles.chartScroller} ref={chartHostRef}>
            <svg
              className={styles.chart}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              preserveAspectRatio="none"
              role="group"
              aria-label={`${metricOption.label} por proceso para las carreras seleccionadas`}
            >
              {domain.ticks.map((value) => {
                const y = yPosition(value);
                return (
                  <g key={value}>
                    <line
                      x1={PAD_LEFT}
                      x2={WIDTH - PAD.right}
                      y1={y}
                      y2={y}
                      className={styles.gridLine}
                    />
                    <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" className={styles.axisLabel}>
                      {formatCareerComparisonMetric(
                        value,
                        metric,
                        metric === "admission_rate" ? admissionRatePrecision : undefined,
                      )}
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
                  {(index === 0 ||
                    index === orderedProcesses.length - 1 ||
                    index === activeIndex ||
                    index % xLabelStep === 0) && (
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
              {plottedSeries.map((item) => {
                const style = getCareerSeriesStyle(styleSlots.get(item.id) ?? 0);
                const color = style.color;
                const paths = segments(item.values, xPositions, yPosition);
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
                x={PAD_LEFT}
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
                aria-describedby="history-chart-instructions"
                aria-valuetext={
                  activeProcess
                    ? formatProcessLabel(activeProcess)
                    : "Usa las flechas izquierda y derecha para elegir un proceso"
                }
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    moveActive(-1);
                  } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    moveActive(1);
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    setPinnedProcess({ contextId, processId: orderedProcesses[0].id });
                  } else if (event.key === "End") {
                    event.preventDefault();
                    setPinnedProcess({
                      contextId,
                      processId: orderedProcesses[orderedProcesses.length - 1].id,
                    });
                  } else if (event.key === "Enter")
                    setPinnedProcess({
                      contextId,
                      processId: activeProcess?.id ?? orderedProcesses[0].id,
                    });
                  else if (event.key === "Escape") setPinnedProcess(null);
                }}
                onPointerLeave={() => setHoveredProcess(null)}
                onPointerMove={indexAtPointer}
                onPointerDown={indexAtPointer}
                onClick={indexAtPointer}
              />
            </svg>
          </div>
        ) : null)}
      {view === "chart" && (
        <p className={styles.instructions} id="history-chart-instructions">
          Flechas: cambiar proceso. Toca o haz clic: fijar valores.
        </p>
      )}
      {view === "chart" && hasValues && panelIndex !== null && orderedProcesses[panelIndex] && (
        <div className={styles.processPanel} role="status" aria-live="polite">
          <div className={styles.panelHeader}>
            <strong className={styles.processTitle}>
              {formatProcessLabel(orderedProcesses[panelIndex])} · {metricOption.label}
            </strong>
            {pinnedProcess?.contextId === contextId && (
              <button
                type="button"
                className={styles.clearSelection}
                onClick={() => {
                  setPinnedProcess(null);
                  setHoveredProcess(null);
                }}
              >
                Quitar selección
              </button>
            )}
          </div>
          <ul>
            {orderedSeries.map((item) => {
              const value = item.values[panelIndex];
              const style = getCareerSeriesStyle(styleSlots.get(item.id) ?? 0);
              const availableProcesses = item.values.flatMap((historicalValue, processIndex) =>
                historicalValue !== null && Number.isFinite(historicalValue)
                  ? [formatProcessLabel(orderedProcesses[processIndex])]
                  : [],
              );
              return (
                <li key={item.id}>
                  <span>
                    <i style={{ backgroundColor: style.color }} aria-hidden="true" />
                    {item.label}
                  </span>
                  <strong>
                    {value === null ? "—" : formatCareerComparisonMetric(value, metric)}
                  </strong>
                  {availableProcesses.length === 1 && (
                    <small>
                      Datos disponibles para esta métrica en {availableProcesses[0]}. Un solo
                      proceso no permite evaluar su evolución.
                    </small>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {view === "table" && orderedProcesses.length > 0 && (
        <div className={styles.tableView}>
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
                      <td key={item.id} data-label={item.label}>
                        {item.values[index] === null
                          ? "—"
                          : formatCareerComparisonMetric(item.values[index], metric)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.scrollCue}>
            Desliza horizontalmente para ver todos los procesos y carreras.
          </p>
        </div>
      )}
    </section>
  );
}
