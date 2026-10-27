import type { DemandChartPoint } from "./majorDemandRanking.utils";

export type DemandPointLabel = {
  text: string;
  placement: "right" | "left" | "above" | "below";
};

type Rect = { left: number; top: number; right: number; bottom: number };

const LABEL_HEIGHT = 18;
const MARKER_RADIUS = 7;

function abbreviate(name: string) {
  return name.replace(/^Ingeniería\b/, "Ing.").replace(/^Administración\b/, "Adm.");
}

function labelVariants(name: string) {
  const abbreviated = abbreviate(name);
  const variants = [abbreviated];
  for (const maxLength of [22, 18, 14]) {
    if (abbreviated.length <= maxLength) continue;
    const prefix = abbreviated
      .slice(0, maxLength - 1)
      .replace(/\s+\S*$/, "")
      .trimEnd();
    const shortened = `${prefix || abbreviated.slice(0, maxLength - 1)}…`;
    if (!variants.includes(shortened)) variants.push(shortened);
  }
  return variants;
}

function intersects(left: Rect, right: Rect) {
  return (
    left.left < right.right &&
    left.right > right.left &&
    left.top < right.bottom &&
    left.bottom > right.top
  );
}

function overlapArea(left: Rect, right: Rect) {
  const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
  const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
  return width * height;
}

function nearestNeighborDistance(
  point: DemandChartPoint,
  points: DemandChartPoint[],
  width: number,
  height: number,
) {
  return Math.min(
    ...points
      .filter((item) => item !== point)
      .map((item) =>
        Math.hypot(
          ((point.left - item.left) * width) / 100,
          ((point.bottom - item.bottom) * height) / 100,
        ),
      ),
    Number.POSITIVE_INFINITY,
  );
}

export function createDemandPointLabels(points: DemandChartPoint[], width: number, height: number) {
  const placements = new Map<number, DemandPointLabel>();
  if (width <= 0 || height <= 0) return placements;

  const placedRects: Rect[] = [];
  const orderedPoints = [...points].sort(
    (left, right) =>
      nearestNeighborDistance(right, points, width, height) -
      nearestNeighborDistance(left, points, width, height),
  );
  const markers = points.map((point) => ({
    id: point.major.major_id,
    x: (point.left * width) / 100,
    y: height - (point.bottom * height) / 100,
  }));

  for (const point of orderedPoints) {
    const x = (point.left * width) / 100;
    const y = height - (point.bottom * height) / 100;
    let best: { rect: Rect; label: DemandPointLabel; score: number } | null = null;

    for (const text of labelVariants(point.major.major_name)) {
      const labelWidth = Math.min(width - 8, Math.max(32, text.length * 5.5 + 8));
      const placements: DemandPointLabel["placement"][] = ["right", "left", "above", "below"];
      for (const placement of placements) {
        const rect =
          placement === "right"
            ? {
                left: x + MARKER_RADIUS + 2,
                top: y - LABEL_HEIGHT / 2,
                right: x + MARKER_RADIUS + 2 + labelWidth,
                bottom: y + LABEL_HEIGHT / 2,
              }
            : placement === "left"
              ? {
                  left: x - MARKER_RADIUS - 2 - labelWidth,
                  top: y - LABEL_HEIGHT / 2,
                  right: x - MARKER_RADIUS - 2,
                  bottom: y + LABEL_HEIGHT / 2,
                }
              : placement === "above"
                ? {
                    left: x - labelWidth / 2,
                    top: y - MARKER_RADIUS - 3 - LABEL_HEIGHT,
                    right: x + labelWidth / 2,
                    bottom: y - MARKER_RADIUS - 3,
                  }
                : {
                    left: x - labelWidth / 2,
                    top: y + MARKER_RADIUS + 3,
                    right: x + labelWidth / 2,
                    bottom: y + MARKER_RADIUS + 3 + LABEL_HEIGHT,
                  };
        const overflow =
          Math.max(0, 4 - rect.left) +
          Math.max(0, 4 - rect.top) +
          Math.max(0, rect.right - width + 4) +
          Math.max(0, rect.bottom - height + 4);
        const labelOverlap = placedRects.reduce(
          (sum, existing) => sum + overlapArea(rect, existing),
          0,
        );
        const markerOverlap = markers
          .filter((marker) => marker.id !== point.major.major_id)
          .filter((marker) =>
            intersects(rect, {
              left: marker.x - MARKER_RADIUS,
              right: marker.x + MARKER_RADIUS,
              top: marker.y - MARKER_RADIUS,
              bottom: marker.y + MARKER_RADIUS,
            }),
          ).length;
        const score = overflow * 1000 + labelOverlap * 10 + markerOverlap * 500;
        if (!best || score < best.score) best = { rect, label: { text, placement }, score };
        if (score === 0) break;
      }
      if (best?.score === 0) break;
    }

    if (best) {
      placements.set(point.major.major_id, best.label);
      placedRects.push(best.rect);
    }
  }

  return placements;
}
