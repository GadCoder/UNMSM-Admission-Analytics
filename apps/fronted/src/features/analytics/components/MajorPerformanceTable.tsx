import { Link } from "react-router-dom";

import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import { admissionRate, type SortDirection, type SortKey } from "./majorPerformance.utils";
import styles from "../pages/DashboardPage.module.css";

type MajorPerformanceTableProps = {
  majors: MajorOverview[];
  process: ProcessOverview["process"];
  rankOffset?: number;
  modality?: string;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
};

export function MajorPerformanceTable({ majors, process, modality, rankOffset = 0, sortKey, sortDirection, onSort }: MajorPerformanceTableProps) {
  const sortableHeader = (key: SortKey, label: string) => {
    const active = sortKey === key;
    const direction = active ? sortDirection : key === "major_name" ? "asc" : "desc";
    return <th scope="col" aria-sort={active ? direction === "asc" ? "ascending" : "descending" : "none"}>
      <button className={styles.performanceSortButton} type="button" onClick={() => onSort(key)} aria-label={`Ordenar por ${label}${active ? `, actualmente ${direction === "asc" ? "ascendente" : "descendente"}` : ""}`}>
        {label}<span aria-hidden="true">{active ? direction === "asc" ? " ↑" : " ↓" : " ↕"}</span>
      </button>
    </th>;
  };

  return <div className={`${styles.tableWrap} ${styles.performanceTableDesktop}`}>
    <table className={styles.performanceTable}>
      <caption className={styles.visuallyHidden}>Indicadores por carrera para {formatProcessLabel(process)}</caption>
      <thead><tr><th scope="col">#</th>{sortableHeader("major_name", "Carrera")}{sortableHeader("total_results", "Postulantes")}{sortableHeader("admitted_count", "Admitidos")}{sortableHeader("admission_rate", "Tasa de admisión")}{sortableHeader("absent_count", "Ausentes")}{sortableHeader("average_score", "Promedio")}</tr></thead>
      <tbody>
        {majors.map((major, index) => <tr key={major.major_id}>
          <td className={styles.performanceRank}>{String(rankOffset + index + 1).padStart(2, "0")}</td>
          <th scope="row"><Link className={styles.majorDetailLink} to={`/analytics/careers/${major.major_id}?${new URLSearchParams({ process: String(process.id), ...(modality ? { modality } : {}) })}`}>{major.major_name}</Link></th>
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
