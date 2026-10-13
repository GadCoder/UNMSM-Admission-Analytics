import type { MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "./MajorDetailHistory.module.css";

type Props = {
  /** Processes ordered newest first; the next item is the comparison baseline. */
  items: MajorDetailProcess[];
  selectedProcessId?: number;
  onSelectProcess?: (processId: number) => void;
};

const SIMILARITY_PERCENT = 5;

function admissionRate(item: MajorDetailProcess) {
  return item.total_results ? (item.admitted_count / item.total_results) * 100 : null;
}

function direction(current: number, previous: number) {
  if (Math.abs(current - previous) <= previous * SIMILARITY_PERCENT / 100) return "similar";
  return current > previous ? "more" : "less";
}

function takeaway(item: MajorDetailProcess, previous: MajorDetailProcess | undefined) {
  if (!item.total_results) return "Sin postulantes registrados";
  if (!previous?.total_results) return "Referencia de participación e ingreso";
  const demand = direction(item.total_results, previous.total_results);
  const admission = direction(item.admitted_count, previous.admitted_count);
  const baseline = formatProcessLabel(previous.process);
  if (demand === "similar" && admission === "similar") return `La participación y el ingreso fueron similares a los de ${baseline}.`;
  if (demand === "similar") return `Hubo ${admission === "more" ? "más" : "menos"} ingresantes que en ${baseline}, con una cantidad similar de postulantes.`;
  if (admission === "similar") return `Hubo ${demand === "more" ? "más" : "menos"} postulantes que en ${baseline}, con una cantidad similar de ingresantes.`;
  return `Hubo ${demand === "more" ? "más" : "menos"} postulantes y ${admission === "more" ? "más" : "menos"} ingresantes que en ${baseline}.`;
}

function AdmissionContext({ item, previous }: { item: MajorDetailProcess; previous?: MajorDetailProcess }) {
  const rate = admissionRate(item);
  const previousRate = previous ? admissionRate(previous) : null;
  if (rate === null) return <p className={styles.context}>No hay una tasa de ingreso calculable para este proceso.</p>;
  return <p className={styles.context}>
    Ingresó el <strong>{formatNumber(rate, 1)}%</strong> de los postulantes
    {previous && previousRate !== null
      ? <>, frente al {formatNumber(previousRate, 1)}% en {formatProcessLabel(previous.process)}.</>
      : "."}
    {previousRate === null && <span className={styles.reference}>{previous
      ? "El proceso anterior no tiene postulantes para comparar."
      : "Primer proceso disponible; sin comparación anterior."}</span>}
  </p>;
}

export function MajorDetailHistory({ items, selectedProcessId, onSelectProcess }: Props) {
  if (!items.length) return <p className={styles.empty}>No hay resultados históricos disponibles para esta carrera.</p>;

  return <div className={styles.history}>
    <ol className={styles.timeline} role="list" aria-label="Historial por proceso">
      {items.map((item, index) => {
        const previous = items[index + 1];
        const label = formatProcessLabel(item.process);
        const selected = selectedProcessId === item.process.id;
        const startsYear = index === 0 || items[index - 1].process.year !== item.process.year;
        const absenceRate = item.total_results ? item.absent_count / item.total_results * 100 : null;
        return <li className={styles.timelineItem} key={item.process.id}>
          {startsYear && <h3 className={styles.year}>{item.process.year}</h3>}
          <article className={`${styles.entry} ${selected ? styles.selected : ""}`} aria-label={`Proceso ${label}`}>
            <div className={styles.period}>
              <span className={styles.marker} aria-hidden="true" />
              <button type="button" className={styles.processButton} aria-pressed={selected} onClick={() => onSelectProcess?.(item.process.id)}>{label}</button>
              {selected && <span className={styles.selectedBadge}>Proceso analizado</span>}
            </div>
            <div className={styles.story}>
              <div className={styles.summary}>
                <h4 className={styles.takeaway}>{takeaway(item, previous)}</h4>
                <p className={styles.facts}><span><strong>{formatNumber(item.total_results)}</strong> postulantes</span><span className={styles.factSeparator} aria-hidden="true"> · </span><span><strong>{formatNumber(item.admitted_count)}</strong> ingresantes</span></p>
                <AdmissionContext item={item} previous={previous} />
              </div>
              <dl className={styles.details}>
                <div><dt>Puntaje promedio</dt><dd>{formatNumber(item.average_score, 2)}</dd></div>
                <div><dt>Puntaje máximo</dt><dd>{formatNumber(item.highest_score, 2)}</dd></div>
                <div><dt>Ausentes</dt><dd>{formatNumber(item.absent_count)}{absenceRate !== null && <> ({formatNumber(absenceRate, 1)}%)</>}</dd></div>
              </dl>
            </div>
          </article>
        </li>;
      })}
    </ol>
    <p className={styles.note}>«Similares» indica cambios de hasta el {SIMILARITY_PERCENT}% en postulantes o ingresantes respecto al proceso anterior.</p>
  </div>;
}
