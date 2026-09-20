import { Link } from "react-router-dom";

import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import { admissionRate } from "./majorPerformance.utils";
import styles from "../pages/DashboardPage.module.css";

type MajorPerformanceTableProps = { majors: MajorOverview[]; process: ProcessOverview["process"] };

export function MajorPerformanceTable({ majors, process }: MajorPerformanceTableProps) {
  return <div className={`${styles.tableWrap} ${styles.performanceTableDesktop}`}>
    <table className={styles.performanceTable}>
      <caption className={styles.visuallyHidden}>Indicadores por carrera para {formatProcessLabel(process)}</caption>
      <thead><tr><th scope="col">#</th><th scope="col">Carrera</th><th scope="col">Postulantes</th><th scope="col">Admitidos</th><th scope="col">Tasa de admisión</th><th scope="col">Ausentes</th><th scope="col">Promedio</th></tr></thead>
      <tbody>
        {majors.map((major, index) => <tr key={major.major_id}>
          <td className={styles.performanceRank}>{String(index + 1).padStart(2, "0")}</td>
          <th scope="row"><Link className={styles.majorDetailLink} to={`/analytics/careers/${major.major_id}?process=${process.id}`}>{major.major_name}</Link></th>
          <td>{formatNumber(major.total_results)}</td>
          <td>{formatNumber(major.admitted_count)}</td>
          <td>{formatNumber(admissionRate(major), 1)}%</td>
          <td>{formatNumber(major.absent_count)}</td>
          <td>{formatNumber(major.average_score, 2)}</td>
        </tr>)}
        {!majors.length && <tr><td colSpan={7}>No hay carreras que coincidan con la búsqueda.</td></tr>}
      </tbody>
    </table>
  </div>;
}
