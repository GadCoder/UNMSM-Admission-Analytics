import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { calculateMetrics } from "./majorDemandRanking.utils";

type MajorDemandChartProps = {
  majors: MajorOverview[];
  totalApplicants: number;
  process: ProcessOverview["process"];
};

export function MajorDemandChart({
  majors,
  totalApplicants,
  process,
}: MajorDemandChartProps) {
  const metrics = majors.map((major) => calculateMetrics(major, totalApplicants));
  const maxShare = Math.max(...metrics.map(({ share }) => share), 1);
  const maxAdmissionRate = Math.max(
    ...metrics.map(({ admissionRate }) => admissionRate),
    1,
  );
  const mostDemanded = majors[0];
  const highestAdmission = majors.reduce((current, major) => {
    const currentRate = calculateMetrics(current, totalApplicants).admissionRate;
    const majorRate = calculateMetrics(major, totalApplicants).admissionRate;
    return majorRate > currentRate ? major : current;
  }, majors[0]);
  const processLabel = formatProcessLabel(process);

  return (
    <section className={styles.demandChart} aria-labelledby="demand-chart-heading">
      <div className={styles.demandChartHeader}>
        <h3 id="demand-chart-heading">Demanda y admisión</h3>
        <span>
          Proceso representado: {processLabel}. Cada punto es una carrera. Más a la
          derecha significa más postulantes; más arriba, una mayor tasa de admisión.
          Los números coinciden con el ranking de la izquierda.
        </span>
      </div>
      <div
        className={styles.demandMatrix}
        role="img"
        aria-label="Matriz de demanda y tasa de admisión por carrera"
      >
        <span className={styles.demandMatrixYAxis}>Tasa de admisión</span>
        <div className={styles.demandMatrixPlot}>
          <span className={styles.demandMatrixHorizontalLabel}>Alta admisión</span>
          <span className={styles.demandMatrixVerticalLabel}>Baja admisión</span>
          {majors.map((major, index) => {
            const { share, admissionRate } = calculateMetrics(major, totalApplicants);
            return (
              <span
                key={major.major_id}
                className={styles.demandMatrixPoint}
                style={{
                  left: `${Math.min(96, Math.max(4, (share / maxShare) * 100))}%`,
                  bottom: `${Math.min(96, Math.max(4, (admissionRate / maxAdmissionRate) * 100))}%`,
                }}
                title={`${major.major_name}: ${formatNumber(share, 1)}% de postulantes, ${formatNumber(admissionRate, 1)}% de admisión`}
              >
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.visuallyHidden}>
                  {major.major_name}: {formatNumber(share, 1)}% de postulantes, {formatNumber(admissionRate, 1)}% de admisión
                </span>
              </span>
            );
          })}
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
        {majors.map((major, index) => {
          const { share, admissionRate } = calculateMetrics(major, totalApplicants);
          return (
            <li key={major.major_id}>
              {String(index + 1).padStart(2, "0")}: {major.major_name},{" "}
              {formatNumber(share, 1)}% de postulantes y {formatNumber(admissionRate, 1)}% de admisión.
            </li>
          );
        })}
      </ol>
      {mostDemanded && highestAdmission && (
        <p className={styles.demandChartSummary}>
          <strong>Lectura rápida:</strong> {mostDemanded.major_name} es la más demandada;{" "}
          {highestAdmission.major_name} tiene una de las mayores tasas de admisión entre estas carreras.
        </p>
      )}
    </section>
  );
}
