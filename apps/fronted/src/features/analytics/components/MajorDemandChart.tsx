import type { MajorOverview } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { AnalyticsSurface } from "./AnalyticsSurface";
import surfaceStyles from "./AnalyticsSurface.module.css";
import { MajorDemandMatrix } from "./MajorDemandMatrix";
import { createDemandChartModel, describeDemandInsight } from "./majorDemandRanking.utils";

type MajorDemandChartProps = {
  majors: MajorOverview[];
};

export function MajorDemandChart({ majors }: MajorDemandChartProps) {
  const model = createDemandChartModel(majors);

  return (
    <AnalyticsSurface className={styles.demandChart} aria-labelledby="demand-map-heading">
      <div className={styles.demandChartHeader}>
        <h2 id="demand-map-heading" className={surfaceStyles.sectionTitle}>¿Qué carreras tienen mayor competencia?</h2>
        <p>Las 6 carreras con más postulantes, según los filtros aplicados.</p>
        <p>Cada punto representa una carrera. Más a la derecha = más postulantes; más abajo = menor tasa de ingreso.</p>
      </div>
      {majors.length > 0 && <>
        <div className={styles.demandMapInsight}>
          <strong>Dato destacado</strong>
          <p>{describeDemandInsight(model.points)}</p>
        </div>
        <MajorDemandMatrix {...model} />
      </>}
    </AnalyticsSurface>
  );
}
