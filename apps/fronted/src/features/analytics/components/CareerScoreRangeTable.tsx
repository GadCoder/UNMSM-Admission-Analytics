import { useEffect, useRef, useState } from "react";
import { getCareerSeriesStyle } from "../utils/careerComparison";
import {
  formatCareerScore,
  scoreKeys,
  scoreLabels,
  type CareerScoreDomain,
  type CareerScoreRow,
} from "./careerComparisonScores.utils";
import styles from "./CareerComparisonScores.module.css";

type Props = {
  rows: CareerScoreRow[];
  seriesSlots: ReadonlyMap<number | string, number>;
  domain: CareerScoreDomain;
};
export function CareerScoreRangeTable({ rows, seriesSlots, domain }: Props) {
  const [chartWidth, setChartWidth] = useState(300);
  const axisRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const axis = axisRef.current;
    if (!axis || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      if (width > 0) setChartWidth((current) => (current === width ? current : width));
    });
    observer.observe(axis);
    return () => observer.disconnect();
  }, []);
  const position = (value: number) =>
    22 + ((value - domain.min) / (domain.max - domain.min || 1)) * (chartWidth - 44);
  return (
    <div className={styles.desktop}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <colgroup>
            <col className={styles.careerColumn} />
            <col className={styles.chartColumn} />
            {scoreKeys.map((key) => (
              <col className={styles.numberColumn} key={key} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Carrera</th>
              <th scope="col" className={styles.rangeHeading}>
                <span>Puntaje</span>
                <svg
                  ref={axisRef}
                  viewBox={`0 0 ${chartWidth} 32`}
                  role="img"
                  aria-label="Escala de puntajes observados"
                >
                  {domain.ticks.map((tick, index) => (
                    <g key={index}>
                      <text x={position(tick)} y="11">
                        {formatCareerScore(tick, "minimum_admitted_score")}
                      </text>
                      <line x1={position(tick)} x2={position(tick)} y1="14" y2="20" />
                    </g>
                  ))}
                  <line x1="22" x2={chartWidth - 22} y1="19" y2="19" />
                </svg>
              </th>
              {scoreKeys.map((key) => (
                <th scope="col" key={key}>
                  {scoreLabels[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const style = getCareerSeriesStyle(seriesSlots.get(row.id) ?? 0);
              const min = row.values.minimum_admitted_score,
                avg = row.values.average_score,
                max = row.values.highest_score;
              return (
                <tr key={row.id}>
                  <th scope="row" className={styles.career}>
                    {row.label}
                  </th>
                  <td className={styles.chartCell}>
                    {row.status ? (
                      <span className={styles.status}>{row.status}</span>
                    ) : min !== null && max !== null && !row.inconsistent ? (
                      <svg
                        viewBox={`0 0 ${chartWidth} 32`}
                        role="img"
                        aria-label={`${row.label}: rango observado de ${formatCareerScore(min, "minimum_admitted_score")} a ${formatCareerScore(max, "highest_score")}${avg === null ? "" : `, promedio ${formatCareerScore(avg, "average_score")}`}`}
                      >
                        <line
                          x1={position(min)}
                          x2={position(max)}
                          y1="16"
                          y2="16"
                          stroke={style.color}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={style.dash || undefined}
                        />
                        <circle cx={position(min)} cy="16" r="5" fill={style.color} />
                        <circle cx={position(max)} cy="16" r="5" fill={style.color} />
                        {avg !== null && (
                          <path
                            d={`M ${position(avg)} 9 l 7 7 -7 7 -7 -7 z`}
                            fill={style.color}
                            stroke="white"
                            strokeWidth="1.5"
                          />
                        )}
                      </svg>
                    ) : (
                      <span className={styles.status}>
                        {row.inconsistent
                          ? "Rango inconsistente"
                          : (row.status ?? "Rango incompleto")}
                      </span>
                    )}
                    {row.inconsistent && (
                      <small className={styles.inconsistent}>
                        {min !== null && max !== null && min > max
                          ? "Rango inconsistente; se muestran los valores reportados."
                          : "Promedio fuera del rango observado; se muestran los valores reportados."}
                      </small>
                    )}
                  </td>
                  {scoreKeys.map((key) => (
                    <td className={styles.number} key={key}>
                      {row.status ?? formatCareerScore(row.values[key], key)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className={styles.legend} aria-label="Leyenda del gráfico">
        <li>
          <span className={styles.legendRange} />
          Rango observado (mínimo–máximo)
        </li>
        <li>
          <span className={styles.legendAverage} />
          Promedio aritmético
        </li>
      </ul>
    </div>
  );
}
