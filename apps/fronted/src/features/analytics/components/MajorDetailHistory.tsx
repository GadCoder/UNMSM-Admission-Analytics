import type { MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";

export function HistoryTable({ items }: { items: MajorDetailProcess[] }) {
  return <>
    <div className={`${styles.tableWrap} ${styles.historyTableDesktop}`}>
      <table aria-label="Historial de resultados por proceso">
        <thead><tr><th scope="col">Proceso</th><th scope="col">Postulantes</th><th scope="col">Postulantes ausentes</th><th scope="col">Porcentaje de ausentes</th><th scope="col">Ingresantes</th><th scope="col">Tasa de ingreso</th><th scope="col">Puntaje máximo</th><th scope="col">Puntaje promedio</th></tr></thead>
        <tbody>{items.map((item) => {
          const rate = item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
          const absenceRate = item.total_results ? (item.absent_count / item.total_results) * 100 : 0;
          return <tr key={item.process.id}>
            <th scope="row">{formatProcessLabel(item.process)}</th>
            <td>{formatNumber(item.total_results)}</td>
            <td>{formatNumber(item.absent_count)}</td>
            <td>{formatNumber(absenceRate, 1)}%</td>
            <td>{formatNumber(item.admitted_count)}</td>
            <td>{formatNumber(rate, 1)}%</td>
            <td>{formatNumber(item.highest_score, 2)}</td>
            <td>{formatNumber(item.average_score, 2)}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <div className={styles.historyCards} role="list" aria-label="Historial por proceso">
      {items.map((item) => {
        const rate = item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
        const absenceRate = item.total_results ? (item.absent_count / item.total_results) * 100 : 0;
        return <article className={styles.historyCard} role="listitem" key={item.process.id}>
          <h3>{formatProcessLabel(item.process)}</h3>
          <dl className={styles.historyCardMetrics}>
            <div><dt>Postulantes</dt><dd>{formatNumber(item.total_results)}</dd></div>
            <div><dt>Postulantes ausentes</dt><dd>{formatNumber(item.absent_count)}</dd></div>
            <div><dt>Porcentaje de ausentes</dt><dd>{formatNumber(absenceRate, 1)}%</dd></div>
            <div><dt>Ingresantes</dt><dd>{formatNumber(item.admitted_count)}</dd></div>
            <div><dt>Tasa de ingreso</dt><dd>{formatNumber(rate, 1)}%</dd></div>
            <div><dt>Puntaje máximo</dt><dd>{formatNumber(item.highest_score, 2)}</dd></div>
            <div><dt>Puntaje promedio</dt><dd>{formatNumber(item.average_score, 2)}</dd></div>
          </dl>
        </article>;
      })}
    </div>
  </>;
}
