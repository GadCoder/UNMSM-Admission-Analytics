import { useId, useState } from "react";
import type { MajorHistoryEntryData } from "./majorDetailHistory.utils";
import styles from "./MajorDetailHistory.module.css";

type Props = {
  entry: MajorHistoryEntryData;
  selected: boolean;
  onSelectProcess?: (processId: number) => void;
};

function AdmissionContext({ admission }: { admission: MajorHistoryEntryData["admission"] }) {
  if (admission.rate === null)
    return (
      <p className={styles.context}>No hay una tasa de ingreso calculable para este proceso.</p>
    );
  return (
    <p className={styles.context}>
      Ingresó el <strong>{admission.rate}%</strong> de los postulantes
      {admission.previousRate !== null ? (
        <>
          , frente al {admission.previousRate}% en {admission.previousLabel}.
        </>
      ) : (
        "."
      )}
      {admission.reference && <span className={styles.reference}>{admission.reference}</span>}
    </p>
  );
}

export function MajorHistoryEntry({ entry, selected, onSelectProcess }: Props) {
  const detailsId = useId();
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  return (
    <article
      className={`${styles.entry} ${selected ? styles.selected : ""}`}
      aria-label={`Proceso ${entry.label}`}
    >
      <div className={styles.period}>
        <span className={styles.marker} aria-hidden="true" />
        <button
          type="button"
          className={styles.processButton}
          aria-pressed={selected}
          onClick={() => onSelectProcess?.(entry.id)}
        >
          {entry.label}
        </button>
        {selected && <span className={styles.selectedBadge}>Proceso analizado</span>}
      </div>
      <div className={styles.story}>
        <div className={styles.summary}>
          <h4 className={styles.takeaway}>{entry.takeaway}</h4>
          <p className={`${styles.facts} ${styles.desktopFacts}`}>
            <span>
              <strong>{entry.applicants}</strong> postulantes
            </span>
            <span className={styles.factSeparator} aria-hidden="true">
              {" "}
              ·{" "}
            </span>
            <span>
              <strong>{entry.admitted}</strong> ingresantes
            </span>
          </p>
          <div className={styles.mobileMetrics}>
            <div className={styles.metric}>
              <span>Postulantes</span>
              <strong>{entry.applicants}</strong>
              <small>{entry.applicantChange ?? "—"}</small>
            </div>
            <div className={styles.metric}>
              <span>Ingresantes</span>
              <strong>{entry.admitted}</strong>
              <small>{entry.admittedChange ?? "—"}</small>
            </div>
          </div>
          {entry.changeDescription && (
            <p className={`${styles.context} ${styles.change}`}>{entry.changeDescription}</p>
          )}
          <AdmissionContext admission={entry.admission} />
          <div className={styles.mobileRate}>
            <span>Tasa de ingreso</span>
            <strong>{entry.admission.rate === null ? "—" : `${entry.admission.rate}%`}</strong>
          </div>
        </div>
        <dl className={`${styles.details} ${styles.desktopDetails}`}>
          {entry.details.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.mobileDisclosure}>
          <button
            type="button"
            className={styles.detailsButton}
            aria-expanded={detailsExpanded}
            aria-controls={detailsId}
            onClick={() => setDetailsExpanded(!detailsExpanded)}
          >
            Estadísticas adicionales
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m3.5 6 4.5 4 4.5-4" />
            </svg>
          </button>
          {detailsExpanded && (
            <dl className={styles.mobileDetails} id={detailsId}>
              {entry.details.map((detail) => (
                <div key={detail.label}>
                  <dt>{detail.label}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
              <div>
                <dt>
                  Tasa de ingreso anterior
                  {entry.admission.previousLabel ? ` (${entry.admission.previousLabel})` : ""}
                </dt>
                <dd>
                  {entry.admission.previousRate === null ? "—" : `${entry.admission.previousRate}%`}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </article>
  );
}
