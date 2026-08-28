import { useMemo, useState } from "react";

import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

type MajorBreakdownProps = {
  overview: ProcessOverview;
};

type SortKey = "total_results" | "admitted_count" | "average_score" | "major_name";

export function MajorBreakdown({ overview }: MajorBreakdownProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("total_results");
  const majors = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...overview.majors]
      .filter((major) => major.major_name.toLocaleLowerCase().includes(normalizedQuery))
      .sort((left, right) => {
        if (sort === "major_name") return left.major_name.localeCompare(right.major_name, "es");
        if (sort === "average_score") return Number(right.average_score ?? -Infinity) - Number(left.average_score ?? -Infinity);
        return right[sort] - left[sort];
      });
  }, [overview.majors, query, sort]);

  return (
    <div className={styles.card}>
      <h2>Desempeño por carrera</h2>
      <div className={styles.tableControls} aria-label="Filtros y orden de carreras">
        <label className={styles.tableFilter}>
          <span>Filtrar carreras</span>
          <input
            type="search"
            aria-label="Filtrar carreras"
            placeholder="Busca por nombre"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className={styles.tableSort}>
          <span>Ordenar carreras</span>
          <select aria-label="Ordenar carreras" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="total_results">Más postulantes</option>
            <option value="admitted_count">Más admitidos</option>
            <option value="average_score">Mayor promedio</option>
            <option value="major_name">Nombre de carrera</option>
          </select>
        </label>
      </div>
      <div className={styles.tableWrap}>
        <table>
          <caption className={styles.visuallyHidden}>
            Indicadores por carrera para {overview.process.name}
          </caption>
          <thead>
            <tr>
              <th scope="col">Carrera</th>
              <th scope="col">Postulantes</th>
              <th scope="col">Admitidos</th>
              <th scope="col">Ausentes</th>
              <th scope="col">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {majors.map((major) => (
              <tr key={major.major_id}>
                <th scope="row">{major.major_name}</th>
                <td>{formatNumber(major.total_results)}</td>
                <td>{formatNumber(major.admitted_count)}</td>
                <td>{formatNumber(major.absent_count)}</td>
                <td>{formatNumber(major.average_score, 2)}</td>
              </tr>
            ))}
            {!majors.length && (
              <tr><td colSpan={5}>No hay carreras que coincidan con la búsqueda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
