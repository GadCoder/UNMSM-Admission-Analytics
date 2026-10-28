import {
  prepareCareerScoreRows,
  getCareerScoreDomain,
  type CareerScoreSelection,
} from "./careerComparisonScores.utils";
import { CareerScoreRangeTable } from "./CareerScoreRangeTable";
import { CareerScoreMobileTable } from "./CareerScoreMobileTable";
import styles from "./CareerComparisonScores.module.css";

export type { CareerScoreSelection } from "./careerComparisonScores.utils";
type Props = {
  selected: CareerScoreSelection[];
  seriesSlots: ReadonlyMap<number | string, number>;
};

export function CareerComparisonScores({ selected, seriesSlots }: Props) {
  const rows = prepareCareerScoreRows(selected);
  const values = rows.flatMap(({ values: rowValues, status, inconsistent }) =>
    status || inconsistent
      ? []
      : [rowValues.minimum_admitted_score, rowValues.highest_score].filter(
          (value): value is number => value !== null,
        ),
  );
  const domain = getCareerScoreDomain(values);
  const hasModalityMismatch = rows.some((row) => row.status === "No comparable");
  return (
    <div className={styles.root}>
      <p className={styles.subtitle}>
        Puntajes observados entre los ingresantes del proceso seleccionado.
      </p>
      <CareerScoreRangeTable rows={rows} seriesSlots={seriesSlots} domain={domain} />
      <CareerScoreMobileTable rows={rows} />
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
