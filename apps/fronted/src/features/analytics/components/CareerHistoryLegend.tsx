import { getCareerSeriesStyle } from "../utils/careerComparison";
import { marker } from "./careerHistoryDrawing";
import styles from "./CareerComparisonHistory.module.css";

type LegendCareer = { id: number | string; label: string };
type CareerHistoryLegendProps = {
  careers: LegendCareer[];
  styleSlots: ReadonlyMap<number | string, number>;
  pinnedId: number | string | null;
  onHover: (id: number | string | null) => void;
  onPin: (id: number | string) => void;
  onClear: () => void;
};

export function CareerHistoryLegend({
  careers,
  styleSlots,
  pinnedId,
  onHover,
  onPin,
  onClear,
}: CareerHistoryLegendProps) {
  return (
    <ul className={styles.legend} aria-label="Carreras del gráfico">
      {careers.map((career) => {
        const style = getCareerSeriesStyle(styleSlots.get(career.id) ?? 0);
        return (
          <li key={career.id}>
            <button
              type="button"
              className={styles.legendButton}
              aria-pressed={pinnedId === career.id}
              onPointerEnter={() => onHover(career.id)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => onHover(career.id)}
              onBlur={() => onHover(null)}
              onKeyDown={(event) => {
                if (event.key === "Escape") onClear();
              }}
              onClick={() => onPin(career.id)}
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
              {career.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
