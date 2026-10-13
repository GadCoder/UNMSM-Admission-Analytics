import type { MajorDetailProcess } from "../api/analytics.types";
import { MajorHistoryEntry } from "./MajorHistoryEntry";
import { buildMajorHistoryEntries, SIMILARITY_PERCENT } from "./majorDetailHistory.utils";
import styles from "./MajorDetailHistory.module.css";

type Props = {
  /** Processes ordered newest first; the next item is the comparison baseline. */
  items: MajorDetailProcess[];
  selectedProcessId?: number;
  onSelectProcess?: (processId: number) => void;
};

export function MajorDetailHistory({ items, selectedProcessId, onSelectProcess }: Props) {
  if (!items.length) return <p className={styles.empty}>No hay resultados históricos disponibles para esta carrera.</p>;

  return <div className={styles.history}>
    <ol className={styles.timeline} role="list" aria-label="Historial por proceso">
      {buildMajorHistoryEntries(items).map(entry => <li className={styles.timelineItem} key={entry.id}>
        {entry.startsYear && <h3 className={styles.year}>{entry.year}</h3>}
        <MajorHistoryEntry entry={entry} selected={selectedProcessId === entry.id} onSelectProcess={onSelectProcess} />
      </li>)}
    </ol>
    <p className={styles.note}>«Similares» indica cambios de hasta el {SIMILARITY_PERCENT}% en postulantes o ingresantes respecto al proceso anterior.</p>
  </div>;
}
