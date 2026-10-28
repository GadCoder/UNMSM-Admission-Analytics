import { useEffect, useMemo, useRef, useState } from "react";
import type { AdmissionProcess } from "../api/analytics.types";
import type { PointerEvent, MouseEvent } from "react";
import { SelectField } from "./SelectField";
import { CareerHistoryTable } from "./CareerHistoryTable";
import { CareerHistoryPlot } from "./CareerHistoryPlot";
import { CareerHistoryLegend } from "./CareerHistoryLegend";
import { CareerHistoryProcessPanel } from "./CareerHistoryProcessPanel";
import {
  alignCareerHistory,
  buildCareerHistoryInsight,
  CAREER_COMPARISON_METRICS,
  getCareerHistoryDomain,
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
  periodLabel?: string;
};

const HEIGHT = 300;
const PAD = { top: 18, right: 22, bottom: 48, left: 70 };
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
  periodLabel,
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
          <p>
            Compara cómo han cambiado los resultados entre procesos de admisión.
            {periodLabel ? ` Periodo histórico: ${periodLabel}.` : ""}
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
        <CareerHistoryLegend
          careers={
            expectedCareers.length
              ? expectedCareers.map(
                  (expected) => series.find((item) => item.id === expected.id) ?? expected,
                )
              : series
          }
          styleSlots={styleSlots}
          pinnedId={effectivePinnedCareerId}
          onHover={setHoveredCareerId}
          onPin={(id) => {
            setPinnedCareerId((current) => (current === id ? null : id));
            setHoveredCareerId(null);
          }}
          onClear={() => {
            setPinnedCareerId(null);
            setHoveredCareerId(null);
          }}
        />
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
            <CareerHistoryPlot
              geometry={{
                width: WIDTH,
                height: HEIGHT,
                padLeft: PAD_LEFT,
                pad: PAD,
                tickValues: domain.ticks,
                admissionRatePrecision,
                xPositions,
                xLabelStep,
                yPosition,
              }}
              interaction={{
                onMoveActive: moveActive,
                onSetPinnedProcess: (processId) => setPinnedProcess({ contextId, processId }),
                onClearPinnedProcess: () => setPinnedProcess(null),
                onPointerLeave: () => setHoveredProcess(null),
                onPointerIndex: indexAtPointer,
              }}
              metric={metric}
              metricLabel={metricOption.label}
              processes={orderedProcesses}
              plottedSeries={plottedSeries}
              styleSlots={styleSlots}
              activeIndex={activeIndex}
              activeCareerId={activeCareerId}
            />
          </div>
        ) : null)}
      {view === "chart" && (
        <p className={styles.instructions} id="history-chart-instructions">
          Flechas: cambiar proceso. Toca o haz clic: fijar valores.
        </p>
      )}
      {view === "chart" && hasValues && panelIndex !== null && orderedProcesses[panelIndex] && (
        <CareerHistoryProcessPanel
          processes={orderedProcesses}
          series={orderedSeries}
          index={panelIndex}
          metric={metric}
          metricLabel={metricOption.label}
          styleSlots={styleSlots}
          pinned={pinnedProcess?.contextId === contextId}
          onClear={() => {
            setPinnedProcess(null);
            setHoveredProcess(null);
          }}
        />
      )}
      {view === "table" && orderedProcesses.length > 0 && (
        <CareerHistoryTable
          processes={orderedProcesses}
          series={orderedSeries}
          metric={metric}
          metricLabel={metricOption.label}
        />
      )}
    </section>
  );
}
