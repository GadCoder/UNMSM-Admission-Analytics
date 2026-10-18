import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import { AnalyticsSurface } from "./AnalyticsSurface";
import { MajorDemandMatrix } from "./MajorDemandMatrix";
import { createDemandChartModel } from "./majorDemandRanking.utils";

type MajorDemandChartProps = {
  majors: MajorOverview[];
  process: ProcessOverview["process"];
};

export function MajorDemandChart({ majors, process }: MajorDemandChartProps) {
  const processLabel = formatProcessLabel(process);
  const model = createDemandChartModel(majors);
  const selectionLabel = majors.length === 1
    ? "La carrera con más postulantes"
    : `Las ${majors.length} carreras con más postulantes`;

  return (
    <AnalyticsSurface className={styles.demandChart} aria-labelledby="demand-map-heading">
      <div className={styles.demandChartHeader}>
        <h2 id="demand-map-heading">Mapa de demanda y admisión</h2>
        <p>
          {majors.length ? `${selectionLabel} en ${processLabel}, según los filtros aplicados.` : "No hay carreras disponibles con los filtros aplicados."}
          {majors.length > 0 && " A la derecha hay más postulantes; arriba, un mayor porcentaje de ellos ingresó."}
        </p>
      </div>
      {majors.length > 0 && <MajorDemandMatrix {...model} />}
    </AnalyticsSurface>
  );
}
