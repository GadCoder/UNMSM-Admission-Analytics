import type { MajorHistoryEntryData } from "./majorDetailHistory.utils";
import styles from "./MajorDetailHistory.module.css";

type Props = {
  entry: MajorHistoryEntryData;
  selected: boolean;
  onSelectProcess?: (processId: number) => void;
};

function AdmissionContext({ admission }: { admission: MajorHistoryEntryData["admission"] }) {
  if (admission.rate === null) return <p className={styles.context}>No hay una tasa de ingreso calculable para este proceso.</p>;
  return <p className={styles.context}>
    Ingresó el <strong>{admission.rate}%</strong> de los postulantes
    {admission.previousRate !== null
      ? <>, frente al {admission.previousRate}% en {admission.previousLabel}.</>
      : "."}
    {admission.reference && <span className={styles.reference}>{admission.reference}</span>}
  </p>;
}

export function MajorHistoryEntry({ entry, selected, onSelectProcess }: Props) {
  return <article className={`${styles.entry} ${selected ? styles.selected : ""}`} aria-label={`Proceso ${entry.label}`}>
    <div className={styles.period}>
      <span className={styles.marker} aria-hidden="true" />
      <button type="button" className={styles.processButton} aria-pressed={selected} onClick={() => onSelectProcess?.(entry.id)}>{entry.label}</button>
      {selected && <span className={styles.selectedBadge}>Proceso analizado</span>}
    </div>
    <div className={styles.story}>
      <div className={styles.summary}>
        <h4 className={styles.takeaway}>{entry.takeaway}</h4>
        <p className={styles.facts}>
          <span><strong>{entry.applicants}</strong> postulantes</span>
          <span className={styles.factSeparator} aria-hidden="true"> · </span>
          <span><strong>{entry.admitted}</strong> ingresantes</span>
        </p>
        {entry.changeDescription && <p className={`${styles.context} ${styles.change}`}>{entry.changeDescription}</p>}
        <AdmissionContext admission={entry.admission} />
      </div>
      <dl className={styles.details}>
        {entry.details.map(detail => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}
      </dl>
    </div>
  </article>;
}
