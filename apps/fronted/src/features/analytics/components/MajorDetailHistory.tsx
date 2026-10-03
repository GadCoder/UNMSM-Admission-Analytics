import type { MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";

type Highlight = {
  label: string;
  value: string;
  periods: string;
};

function admissionRate(item: MajorDetailProcess) {
  return item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
}

function highestPeriods(items: MajorDetailProcess[], value: (item: MajorDetailProcess) => number) {
  const maximum = Math.max(...items.map(value));
  return {
    maximum,
    labels: items.filter((item) => value(item) === maximum).map((item) => formatProcessLabel(item.process)),
  };
}

function historicalHighlights(items: MajorDetailProcess[]): Highlight[] {
  const demand = highestPeriods(items, (item) => item.total_results);
  const admission = highestPeriods(items, admissionRate);
  const averageScore = highestPeriods(items, (item) => Number(item.average_score));

  return [
    {
      label: "Mayor demanda",
      value: `${formatNumber(demand.maximum)} postulantes`,
      periods: demand.labels.join(" y "),
    },
    {
      label: "Mayor tasa de ingreso",
      value: `${formatNumber(admission.maximum, 1)}%`,
      periods: admission.labels.join(" y "),
    },
    {
      label: "Mayor puntaje promedio",
      value: formatNumber(averageScore.maximum, 2),
      periods: averageScore.labels.join(" y "),
    },
  ];
}

function HistoryHighlights({ items }: { items: MajorDetailProcess[] }) {
  return <ul className={styles.historyHighlights} aria-label="Puntos clave del historial">
    {historicalHighlights(items).map((highlight) => <li key={highlight.label}>
      <span>{highlight.label}</span>
      <strong>{highlight.value}</strong>
      <small>{highlight.periods}</small>
    </li>)}
  </ul>;
}

export function HistoryTable({ items }: { items: MajorDetailProcess[] }) {
  return <>
    <HistoryHighlights items={items} />
    <div className={`${styles.tableWrap} ${styles.historyTableDesktop}`}>
      <table className={styles.historyTable} aria-label="Historial de resultados por proceso">
        <thead><tr>
          <th scope="col">Proceso</th>
          <th scope="col">Postulantes</th>
          <th scope="col">Ausentes</th>
          <th scope="col">% ausentes</th>
          <th scope="col">Ingresantes</th>
          <th scope="col">Tasa de ingreso</th>
          <th scope="col">Puntaje máximo</th>
          <th scope="col">Puntaje promedio</th>
        </tr></thead>
        <tbody>{items.map((item) => {
          const rate = admissionRate(item);
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
        const rate = admissionRate(item);
        const processLabel = formatProcessLabel(item.process);
        return <article className={styles.historyCard} role="listitem" key={item.process.id}>
          <h3>{processLabel}</h3>
          <dl className={styles.historyCardMetrics}>
            <div><dt>Postulantes</dt><dd>{formatNumber(item.total_results)}</dd></div>
            <div><dt>Postulantes ausentes</dt><dd>{formatNumber(item.absent_count)}</dd></div>
            <div><dt>Ingresantes</dt><dd>{formatNumber(item.admitted_count)}</dd></div>
            <div><dt>Porcentaje de ingresantes</dt><dd>{formatNumber(rate, 1)}%</dd></div>
            <div><dt>Puntaje máximo</dt><dd>{formatNumber(item.highest_score, 2)}</dd></div>
            <div><dt>Puntaje promedio</dt><dd>{formatNumber(item.average_score, 2)}</dd></div>
          </dl>
        </article>;
      })}
    </div>
  </>;
}
