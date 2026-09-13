import type { DemandChartPoint } from "./majorDemandRanking.utils";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

type MajorDemandMatrixProps = {
  points: DemandChartPoint[];
  processLabel: string;
};

export function MajorDemandMatrix({
  points,
  processLabel,
}: MajorDemandMatrixProps) {
  return (
    <>
      <div
        className={styles.demandMatrix}
        role="img"
        aria-label="Matriz de demanda y tasa de admisión por carrera"
      >
        <span className={styles.demandMatrixYAxis}>Tasa de admisión</span>
        <div className={styles.demandMatrixPlot}>
          <span className={styles.demandMatrixHorizontalLabel}>Alta admisión</span>
          <span className={styles.demandMatrixVerticalLabel}>Baja admisión</span>
          {points.map(({ major, rank, share, admissionRate, left, bottom }) => (
            <span
              key={major.major_id}
              className={styles.demandMatrixPoint}
              style={{ left: `${left}%`, bottom: `${bottom}%` }}
              title={`${major.major_name}: ${formatNumber(share, 1)}% de postulantes, ${formatNumber(admissionRate, 1)}% de admisión`}
            >
              <span aria-hidden="true">{String(rank).padStart(2, "0")}</span>
              <span className={styles.visuallyHidden}>
                {major.major_name}: {formatNumber(share, 1)}% de postulantes, {formatNumber(admissionRate, 1)}% de admisión
              </span>
            </span>
          ))}
        </div>
        <div className={styles.demandMatrixXAxis}>
          <span>Menor demanda</span>
          <span>Mayor demanda</span>
        </div>
      </div>
      <ol
        className={styles.visuallyHidden}
        aria-label={`Datos de demanda y admisión de ${processLabel}`}
      >
        {points.map(({ major, rank, share, admissionRate }) => (
          <li key={major.major_id}>
            {String(rank).padStart(2, "0")}: {major.major_name},{" "}
            {formatNumber(share, 1)}% de postulantes y {formatNumber(admissionRate, 1)}% de admisión.
          </li>
        ))}
      </ol>
    </>
  );
}
