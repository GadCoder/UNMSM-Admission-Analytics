import { useRef, useState } from "react";

import type { AdmissionProcess } from "../api/analytics.types";
import { normalizeComparisons } from "../utils/comparisonSelection";
import { formatProcessLabel } from "../utils/processLabels";
import { ResponsiveControlPanel } from "./ResponsiveControlPanel";
import styles from "./DashboardControls.module.css";

export type { DashboardFilters, DashboardFilterControlsProps } from "./DashboardFilterControls";
export { DashboardFilterControls } from "./DashboardFilterControls";

export type DashboardControlsProps = {
  processes: AdmissionProcess[];
  primaryId: string;
  comparisons: string[];
  onChange: (process: string, comparisons: string[]) => void;
};

export function DashboardControls({ processes, primaryId, comparisons, onChange }: DashboardControlsProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const comparisonOptions = processes.filter((process) => String(process.id) !== primaryId);
  const normalizedApplied = normalizeComparisons(primaryId, comparisons, processes);
  const selectionKey = JSON.stringify([primaryId, ...normalizedApplied]);
  const [draftSource, setDraftSource] = useState(selectionKey);
  const applied = normalizedApplied.map((id) => comparisonOptions.find((process) => String(process.id) === id)).filter((process): process is AdmissionProcess => Boolean(process));
  const selectedCount = draft.length;

  // Reset a stale draft only when the applied values change, not on query refreshes.
  if (draftSource !== selectionKey) {
    setDraftSource(selectionKey);
    setDraft(normalizedApplied);
  }

  const openPanel = () => {
    setDraft(applied.map((process) => String(process.id)));
    setOpen(true);
  };
  const closePanel = () => {
    setDraft(normalizedApplied);
    setOpen(false);
  };
  const applyComparison = () => {
    const normalized = normalizeComparisons(primaryId, draft, processes);
    onChange(primaryId, normalized);
    setOpen(false);
  };
  const removeComparison = (id: string) => onChange(primaryId, normalizedApplied.filter((value) => value !== id));

  return <div className={styles.processControls} role="group" aria-label="Proceso analizado y comparación">
    <div className={styles.primaryControl}>
      <label className={styles.primaryLabel} htmlFor="primary-process">Proceso</label>
      <select className={styles.primarySelect} id="primary-process" aria-label="Proceso analizado" value={primaryId} onChange={(event) => {
        const nextPrimary = event.target.value;
        setOpen(false);
        onChange(nextPrimary, comparisons.filter((id) => id !== nextPrimary));
      }}>
        {processes.map((process) => <option key={process.id} value={process.id}>{formatProcessLabel(process)}</option>)}
      </select>
    </div>

    <div className={styles.compareAnchor}>
      <button ref={triggerRef} className={styles.compareButton} type="button" aria-haspopup="dialog" aria-expanded={open}
        aria-label={applied.length > 0 ? `Editar comparaciones: ${applied.map(formatProcessLabel).join(", ")}` : "Añadir proceso para comparar"}
        onClick={open ? closePanel : openPanel}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg> Comparar{applied.length > 0 && <span className={styles.count}> ({applied.length})</span>}
      </button>
      <ResponsiveControlPanel size="compact" open={open} onClose={closePanel} title="Comparar con" triggerRef={triggerRef} footer={<div className={styles.comparisonFooter}>
        <span className={styles.counter} role="status" aria-label={`${selectedCount} de 3 seleccionados`} title={`${selectedCount} de 3 seleccionados`}>{selectedCount} de 3 seleccionados</span>
        <button className={styles.applyButton} type="button" disabled={selectedCount === 0 && applied.length === 0} onClick={applyComparison}>Aplicar comparación</button>
      </div>}>
        <p className={styles.supportingText}>Selecciona hasta 3 procesos adicionales.</p>
        <div className={styles.options}>
          {comparisonOptions.map((process) => {
            const id = String(process.id);
            const checked = draft.includes(id);
            const disabled = !checked && draft.length >= 3;
            return <label key={id} htmlFor={`comparison-process-${id}`} className={`${styles.option} ${disabled ? styles.disabled : ""}`}>
              <input id={`comparison-process-${id}`} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => setDraft((current) => event.target.checked
                ? [...current, id].slice(0, 3)
                : current.filter((value) => value !== id))} />
              <span>{formatProcessLabel(process)}</span>
            </label>;
          })}
        </div>
      </ResponsiveControlPanel>
    </div>

    {applied.length > 0 && <ul className={styles.chips} aria-label="Procesos en comparación">
      {applied.map((process) => <li key={process.id} className={styles.chip}>
        <span>vs. {formatProcessLabel(process)}</span>
        <button type="button" aria-label={`Quitar comparación ${formatProcessLabel(process)}`} onClick={() => removeComparison(String(process.id))}>×</button>
      </li>)}
    </ul>}
  </div>;
}
