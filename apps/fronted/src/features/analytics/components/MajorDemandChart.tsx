import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { MajorDemandMatrix } from "./MajorDemandMatrix";
import { MajorDemandSummary } from "./MajorDemandSummary";
import { createDemandChartModel } from "./majorDemandRanking.utils";

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
  const processLabel = formatProcessLabel(process);
  const { points, mostDemanded, highestAdmission } = createDemandChartModel(
    majors,
    totalApplicants,
  );

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
      <MajorDemandMatrix points={points} processLabel={processLabel} />
      <MajorDemandSummary
        mostDemanded={mostDemanded}
        highestAdmission={highestAdmission}
      />
    </section>
  );
}
