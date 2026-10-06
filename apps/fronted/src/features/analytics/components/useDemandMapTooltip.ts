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
    left: clamp(best.left, TOOLTIP_INSET, plot.width - tooltip.width - TOOLTIP_INSET),
    top: clamp(best.top, TOOLTIP_INSET, plot.height - tooltip.height - TOOLTIP_INSET),
  };
}

export function useDemandMapTooltip() {
  const [selectedPoint, setSelectedPoint] = useState<DemandChartPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const selectPoint = useCallback((point: DemandChartPoint) => {
    setTooltipPosition(null);
    setSelectedPoint(point);
  }, []);

  useLayoutEffect(() => {
    if (!selectedPoint || !plotRef.current || !tooltipRef.current) return;

    const selected = plotRef.current.querySelector<HTMLButtonElement>(`[data-major-id="${selectedPoint.major.major_id}"]`);
    if (!selected) return;

    setTooltipPosition(findTooltipPosition(
      plotRef.current.getBoundingClientRect(),
      tooltipRef.current.getBoundingClientRect(),
      selected.getBoundingClientRect(),
    ));
  }, [selectedPoint]);

  return { plotRef, selectedPoint, selectPoint, tooltipPosition, tooltipRef };
}
