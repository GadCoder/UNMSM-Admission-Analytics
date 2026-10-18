import { useCallback, useLayoutEffect, useRef, useState } from "react";

import type { DemandChartPoint } from "./majorDemandRanking.utils";

export type TooltipPosition = { left: number; top: number };

const TOOLTIP_GAP = 8;
const TOOLTIP_INSET = 4;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function findTooltipPosition(plot: DOMRect, tooltip: DOMRect, point: DOMRect): TooltipPosition {
  const pointLeft = point.left - plot.left;
  const pointTop = point.top - plot.top;
  const candidates = [
    { left: pointLeft + point.width + TOOLTIP_GAP, top: pointTop - tooltip.height - TOOLTIP_GAP },
    { left: pointLeft + point.width + TOOLTIP_GAP, top: pointTop + point.height + TOOLTIP_GAP },
    { left: pointLeft - tooltip.width - TOOLTIP_GAP, top: pointTop - tooltip.height - TOOLTIP_GAP },
    { left: pointLeft - tooltip.width - TOOLTIP_GAP, top: pointTop + point.height + TOOLTIP_GAP },
    { left: pointLeft + point.width + TOOLTIP_GAP, top: pointTop + (point.height - tooltip.height) / 2 },
    { left: pointLeft - tooltip.width - TOOLTIP_GAP, top: pointTop + (point.height - tooltip.height) / 2 },
  ];
  const best = candidates
    .map((candidate, index) => {
      const overflow = Math.max(0, -candidate.left) + Math.max(0, -candidate.top)
        + Math.max(0, candidate.left + tooltip.width - plot.width)
        + Math.max(0, candidate.top + tooltip.height - plot.height);
      return { ...candidate, score: overflow * 1000 + index };
    })
    .sort((left, right) => left.score - right.score)[0];

  return {
    left: clamp(best.left, TOOLTIP_INSET, Math.max(TOOLTIP_INSET, plot.width - tooltip.width - TOOLTIP_INSET)),
    top: clamp(best.top, TOOLTIP_INSET, Math.max(TOOLTIP_INSET, plot.height - tooltip.height - TOOLTIP_INSET)),
  };
}

function getDefaultPoint(points: DemandChartPoint[]) {
  return points.find((point) => point.major.major_name.toLocaleLowerCase("es-PE") === "medicina humana") ?? points[0] ?? null;
}

export function useDemandMapTooltip(points: DemandChartPoint[]) {
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(() => getDefaultPoint(points)?.major.major_id ?? null);
  const selectedPoint = points.find((point) => point.major.major_id === selectedMajorId) ?? getDefaultPoint(points);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pointerAnchorRef = useRef<{ majorId: number; x: number; y: number } | null>(null);

  const selectPoint = useCallback((point: DemandChartPoint) => {
    pointerAnchorRef.current = null;
    setTooltipPosition(null);
    setSelectedMajorId(point.major.major_id);
    setTooltipVisible(true);
  }, []);

  const moveTooltip = useCallback((majorId: number, clientX: number, clientY: number) => {
    if (!tooltipVisible || selectedPoint?.major.major_id !== majorId || !plotRef.current || !tooltipRef.current) return;
    pointerAnchorRef.current = { majorId, x: clientX, y: clientY };
    setTooltipPosition(findTooltipPosition(
      plotRef.current.getBoundingClientRect(),
      tooltipRef.current.getBoundingClientRect(),
      new DOMRect(clientX, clientY, 0, 0),
    ));
  }, [selectedPoint, tooltipVisible]);

  useLayoutEffect(() => {
    if (!tooltipVisible || !selectedPoint || !plotRef.current || !tooltipRef.current) return;

    const selected = plotRef.current.querySelector<HTMLButtonElement>(`[data-major-id="${selectedPoint.major.major_id}"]`);
    if (!selected) return;

    const anchor = pointerAnchorRef.current?.majorId === selectedPoint.major.major_id
      ? new DOMRect(pointerAnchorRef.current.x, pointerAnchorRef.current.y, 0, 0)
      : selected.getBoundingClientRect();
    setTooltipPosition(findTooltipPosition(plotRef.current.getBoundingClientRect(), tooltipRef.current.getBoundingClientRect(), anchor));
  }, [selectedPoint, tooltipVisible]);

  return { plotRef, selectedPoint, selectPoint, moveTooltip, tooltipVisible, tooltipPosition, tooltipRef };
}
