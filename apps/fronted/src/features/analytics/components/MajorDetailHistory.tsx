import { useId, useState } from "react";

import type { MajorDetailProcess } from "../api/analytics.types";
import { MajorHistoryEntry } from "./MajorHistoryEntry";
import { buildMajorHistoryEntries, SIMILARITY_PERCENT } from "./majorDetailHistory.utils";
import styles from "./MajorDetailHistory.module.css";

type Props = {
  /** Processes ordered newest first; the next item is the comparison baseline. */
  items: MajorDetailProcess[];
  selectedProcessId?: number;
  initialProcessCount?: number;
  onSelectProcess?: (processId: number) => void;
};

export function MajorDetailHistory({ items, selectedProcessId, initialProcessCount, onSelectProcess }: Props) {
  const timelineId = useId();
  const entries = buildMajorHistoryEntries(items);
  const initialEntries = entries.slice(0, initialProcessCount);
  const recentIds = new Set(initialEntries.map((entry) => entry.id));
  const hasOlderEntries = entries.length > initialEntries.length;
  const selectedIsOlder = entries.some((entry) => entry.id === selectedProcessId && !recentIds.has(entry.id));
  const selectionKey = `${selectedProcessId}:${[...recentIds].join(",")}`;
  const [disclosure, setDisclosure] = useState({ selectionKey, expanded: selectedIsOlder });
  const expanded = disclosure.selectionKey === selectionKey ? disclosure.expanded : disclosure.expanded || selectedIsOlder;
  const visibleEntries = expanded ? entries : initialEntries;

  if (!items.length) return <p className={styles.empty}>No hay resultados históricos disponibles para esta carrera.</p>;

  return <div className={styles.history}>
    <ol id={timelineId} className={styles.timeline} role="list" aria-label="Historial por proceso">
      {visibleEntries.map(entry => <li className={styles.timelineItem} key={entry.id}>
        {entry.startsYear && <h3 className={styles.year}>{entry.year}</h3>}
        <MajorHistoryEntry entry={entry} selected={selectedProcessId === entry.id} onSelectProcess={onSelectProcess} />
      </li>)}
    </ol>
    {hasOlderEntries && <button className={styles.expandButton} type="button" aria-expanded={expanded} aria-controls={timelineId}
      onClick={() => setDisclosure({ selectionKey, expanded: !expanded })}>
      {expanded ? "Ver menos" : "Ver más"}
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4 4.5-4" /></svg>
    </button>}
    <p className={styles.note}>«Similares» indica cambios de hasta el {SIMILARITY_PERCENT}% en postulantes o ingresantes respecto al proceso anterior.</p>
  </div>;
}
