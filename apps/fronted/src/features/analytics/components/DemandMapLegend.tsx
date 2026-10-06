import type { DemandChartModel } from "./majorDemandRanking.utils";
import { formatNumber } from "../utils/formatters";

type DemandMapLegendProps = Pick<DemandChartModel, "points">;

export function DemandMapLegend({ points }: DemandMapLegendProps) {
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
