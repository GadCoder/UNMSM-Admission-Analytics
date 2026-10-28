import { Fragment, useEffect, useRef, useState } from "react";
import type { MajorDetailProcess } from "../api/analytics.types";
import {
  canCompareAdmittedScores,
  formatCareerComparisonMetric,
  getCareerComparisonMetricValue,
  getCareerSeriesStyle,
} from "../utils/careerComparison";
import { getCareerScoreDomain } from "./careerComparisonScores.utils";
import styles from "./CareerComparisonScores.module.css";

export type CareerScoreSelection = {
  id: number;
  label: string;
  current?: MajorDetailProcess;
};

type Props = {
  selected: CareerScoreSelection[];
  seriesSlots: ReadonlyMap<number | string, number>;
};

const scoreKeys = ["minimum_admitted_score", "average_score", "highest_score"] as const;
type ScoreKey = (typeof scoreKeys)[number];
const labels: Record<ScoreKey, string> = {
  minimum_admitted_score: "Mínimo",
  average_score: "Promedio",
  highest_score: "Máximo",
};

function getRowValues(selected: CareerScoreSelection[]) {
  const anchor = selected
    .map(({ current }) => current)
    .find((record) => record && canCompareAdmittedScores(record, record));
  return selected.map((career) => {
    const current = career.current;
    const hasPopulation = Boolean(current && canCompareAdmittedScores(current, current));
    const comparable = Boolean(
      current && anchor && hasPopulation && canCompareAdmittedScores(anchor, current),
    );
    const values = Object.fromEntries(
      scoreKeys.map((key) => [
        key,
        comparable && current ? getCareerComparisonMetricValue(current, key) : null,
      ]),
    ) as Record<ScoreKey, number | null>;
    return {
      ...career,
      values,
      status:
        !current || current.total_results === 0
          ? "Sin datos"
          : !hasPopulation
            ? "—"
            : !comparable
              ? "No comparable"
              : null,
      inconsistent:
        values.minimum_admitted_score !== null &&
        values.highest_score !== null &&
        (values.minimum_admitted_score > values.highest_score ||
          (values.average_score !== null &&
            (values.average_score < values.minimum_admitted_score ||
              values.average_score > values.highest_score))),
    };
  });
}

function format(value: number | null, key: ScoreKey) {
  return value === null ? "—" : formatCareerComparisonMetric(value, key);
}

export function CareerComparisonScores({ selected, seriesSlots }: Props) {
  const rows = getRowValues(selected);
  const values = rows.flatMap(({ values: rowValues, status, inconsistent }) =>
    status || inconsistent
      ? []
      : [rowValues.minimum_admitted_score, rowValues.highest_score].filter(
          (value): value is number => value !== null,
        ),
  );
  const domain = getCareerScoreDomain(values);
  const hasModalityMismatch = rows.some((row) => row.status === "No comparable");
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
    <div className={styles.root}>
      <p className={styles.subtitle}>
        Puntajes observados entre los ingresantes del proceso seleccionado.
      </p>
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
                          {formatCareerComparisonMetric(tick, "minimum_admitted_score")}
                        </text>
                        <line x1={position(tick)} x2={position(tick)} y1="14" y2="20" />
                      </g>
                    ))}
                    <line x1="22" x2={chartWidth - 22} y1="19" y2="19" />
                  </svg>
                </th>
                {scoreKeys.map((key) => (
                  <th scope="col" key={key}>
                    {labels[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const style = getCareerSeriesStyle(seriesSlots.get(row.id) ?? 0);
                const min = row.values.minimum_admitted_score;
                const avg = row.values.average_score;
                const max = row.values.highest_score;
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
                          aria-label={`${row.label}: rango observado de ${format(min, "minimum_admitted_score")} a ${format(max, "highest_score")}${avg === null ? "" : `, promedio ${format(avg, "average_score")}`}`}
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
                          {avg !== null && !row.inconsistent && (
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
                        {row.status ?? format(row.values[key], key)}
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
      <div className={styles.mobile}>
        <table className={styles.mobileTable}>
          <thead>
            <tr>
              <th scope="col">Carrera</th>
              {scoreKeys.map((key) => (
                <th scope="col" key={key}>
                  {labels[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr>
                  <th className={styles.mobileCareer} scope="rowgroup" colSpan={3}>
                    {row.label}
                    {row.status && <small>{row.status}</small>}
                    {row.inconsistent && (
                      <small>
                        {row.values.minimum_admitted_score !== null &&
                        row.values.highest_score !== null &&
                        row.values.minimum_admitted_score > row.values.highest_score
                          ? "Rango inconsistente; valores reportados."
                          : "Promedio fuera del rango observado; valores reportados."}
                      </small>
                    )}
                  </th>
                </tr>
                <tr>
                  {scoreKeys.map((key) => (
                    <td
                      className={
                        key === "minimum_admitted_score" ? styles.mobileMinimum : undefined
                      }
                      data-label={labels[key]}
                      key={key}
                    >
                      {row.status ?? format(row.values[key], key)}
                    </td>
                  ))}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.population}>
        El puntaje mínimo es el menor puntaje válido registrado entre los ingresantes. No es un
        puntaje oficial de corte ni garantiza el ingreso en otro proceso.
        {hasModalityMismatch && (
          <span className={styles.modalityCaveat}>
            {" "}
            La comparación requiere que las carreras compartan modalidad de puntaje.
          </span>
        )}
      </p>
    </div>
  );
}
