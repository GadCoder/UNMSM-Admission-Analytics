import type { MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";

export function HistoryTable({ items }: { items: MajorDetailProcess[] }) {
  return <div className={styles.tableWrap}>
    <table aria-label="Historial de resultados por proceso">
      <thead><tr><th scope="col">Proceso</th><th scope="col">Postulantes</th><th scope="col">Ingresantes</th><th scope="col">Tasa de ingreso</th><th scope="col">Puntaje promedio</th></tr></thead>
      <tbody>{items.map((item) => {
        const rate = item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
        return <tr key={item.process.id}>
          <th scope="row">{formatProcessLabel(item.process)}</th>
          <td>{formatNumber(item.total_results)}</td>
          <td>{formatNumber(item.admitted_count)}</td>
          <td>{formatNumber(rate, 1)}%</td>
          <td>{formatNumber(item.average_score, 2)}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
