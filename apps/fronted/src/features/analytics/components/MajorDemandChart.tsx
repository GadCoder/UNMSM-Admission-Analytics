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

  return (
    <AnalyticsSurface className={styles.demandChart} aria-labelledby="demand-map-heading">
      <div className={styles.demandChartHeader}>
        <h2 id="demand-map-heading">Mapa de demanda y admisión</h2>
        <p>
          Las carreras con más postulantes en {processLabel}. Más a la derecha significa
          más demanda; más arriba, mayor porcentaje de ingresantes.
        </p>
      </div>
      <MajorDemandMatrix {...model} />
    </AnalyticsSurface>
  );
}
