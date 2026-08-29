import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { MajorOverview, ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";

type MajorBreakdownProps = { overview: ProcessOverview; filterControls?: ReactNode };
type SortKey = "total_results" | "admitted_count" | "admission_rate" | "average_score" | "major_name";
type SortDirection = "asc" | "desc";

function admissionRate(major: MajorOverview) {
  return major.total_results ? (major.admitted_count / major.total_results) * 100 : 0;
}

export function MajorBreakdown({ overview, filterControls }: MajorBreakdownProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [sortKey, setSortKey] = useState<SortKey>("total_results");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const majors = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase();
    return [...overview.majors].filter((major) => major.major_name.toLocaleLowerCase().includes(normalizedQuery)).sort((left, right) => {
      if (sortKey === "major_name") return sortDirection === "asc" ? left.major_name.localeCompare(right.major_name, "es") : right.major_name.localeCompare(left.major_name, "es");
      const leftValue = sortKey === "admission_rate" ? admissionRate(left) : sortKey === "average_score" ? Number(left.average_score ?? -Infinity) : left[sortKey];
      const rightValue = sortKey === "admission_rate" ? admissionRate(right) : sortKey === "average_score" ? Number(right.average_score ?? -Infinity) : right[sortKey];
      return sortDirection === "asc" ? leftValue - rightValue : rightValue - leftValue;
    });
  }, [debouncedQuery, overview.majors, sortDirection, sortKey]);

  const updateSort = (value: string) => {
    const [nextKey, nextDirection] = value.split("-") as [SortKey, SortDirection];
    setSortKey(nextKey);
    setSortDirection(nextDirection);
  };

  return <section className={styles.card} aria-labelledby="major-breakdown-heading">
    <div className={styles.sectionHeading}>
      <h2 id="major-breakdown-heading">Desempeño por carrera</h2>
      {filterControls}
    </div>
    <div className={styles.tableControls} aria-label="Filtros y orden de carreras">
      <label className={styles.tableFilter}><span>Filtrar carreras</span><input type="search" aria-label="Filtrar carreras" placeholder="Busca por nombre" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <label className={styles.tableSort}><span>Ordenar carreras</span><select aria-label="Ordenar carreras" value={`${sortKey}-${sortDirection}`} onChange={(event) => updateSort(event.target.value)}>
        <option value="total_results-desc">Más postulantes</option><option value="total_results-asc">Menos postulantes</option>
        <option value="admitted_count-desc">Más admitidos</option><option value="admitted_count-asc">Menos admitidos</option>
        <option value="admission_rate-desc">Mayor tasa de admisión</option><option value="admission_rate-asc">Menor tasa de admisión</option>
        <option value="average_score-desc">Mayor promedio</option><option value="average_score-asc">Menor promedio</option>
        <option value="major_name-asc">Nombre de carrera (A-Z)</option><option value="major_name-desc">Nombre de carrera (Z-A)</option>
      </select></label>
    </div>
    <div className={styles.tableWrap}><table><caption className={styles.visuallyHidden}>Indicadores por carrera para {formatProcessLabel(overview.process)}</caption><thead><tr><th scope="col">Carrera</th><th scope="col">Postulantes</th><th scope="col">Admitidos</th><th scope="col">Tasa de admisión</th><th scope="col">Ausentes</th><th scope="col">Promedio</th></tr></thead><tbody>
      {majors.map((major) => <tr key={major.major_id}><th scope="row">{major.major_name}</th><td>{formatNumber(major.total_results)}</td><td>{formatNumber(major.admitted_count)}</td><td>{formatNumber(admissionRate(major), 1)}%</td><td>{formatNumber(major.absent_count)}</td><td>{formatNumber(major.average_score, 2)}</td></tr>)}
      {!majors.length && <tr><td colSpan={6}>No hay carreras que coincidan con la búsqueda.</td></tr>}
    </tbody></table></div>
  </section>;
}
