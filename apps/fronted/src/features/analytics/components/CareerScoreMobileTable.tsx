import { Fragment } from "react";
import {
  formatCareerScore,
  scoreKeys,
  scoreLabels,
  type CareerScoreRow,
} from "./careerComparisonScores.utils";
import styles from "./CareerComparisonScores.module.css";

export function CareerScoreMobileTable({ rows }: { rows: CareerScoreRow[] }) {
  return (
    <div className={styles.mobile}>
      <table className={styles.mobileTable}>
        <thead>
          <tr>
            <th scope="col">Carrera</th>
            {scoreKeys.map((key) => (
              <th scope="col" key={key}>
                {scoreLabels[key]}
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
                    className={key === "minimum_admitted_score" ? styles.mobileMinimum : undefined}
                    data-label={scoreLabels[key]}
                    key={key}
                  >
                    {row.status ?? formatCareerScore(row.values[key], key)}
                  </td>
                ))}
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
