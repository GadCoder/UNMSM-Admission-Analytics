import type { AdmissionProcess } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";

type DashboardControlsProps = {
  processes: AdmissionProcess[];
  primaryId: string;
  comparisons: string[];
  onChange: (process: string, comparisons: string[]) => void;
};

export function DashboardControls({
  processes,
  primaryId,
  comparisons,
  onChange,
}: DashboardControlsProps) {
  const comparisonOptions = processes.filter((process) => String(process.id) !== primaryId);
  const selectedProcesses = comparisonOptions.filter((process) =>
    comparisons.includes(String(process.id)),
  );
  const comparisonSummary = selectedProcesses.length
    ? selectedProcesses.length === 1
      ? selectedProcesses[0].name
      : `${selectedProcesses.length} procesos seleccionados`
    : "Selecciona procesos";

  return (
    <div className={styles.controls} aria-label="Selección de procesos">
      <div className={styles.control}>
        <label htmlFor="primary-process">Proceso</label>
        <select
          id="primary-process"
          value={primaryId}
          onChange={(event) => onChange(event.target.value, comparisons)}
        >
          {processes.map((process) => (
            <option key={process.id} value={process.id}>
              {process.name}
            </option>
          ))}
        </select>
      </div>
      <details className={`${styles.control} ${styles.comparisonControl}`}>
        <summary>
          <span className={styles.controlLabel}>Comparar con</span>
          <span className={styles.comparisonValue}>{comparisonSummary}</span>
          <span className={styles.chevron} aria-hidden="true">⌄</span>
        </summary>
        <div className={styles.comparisonMenu} role="listbox" aria-label="Procesos para comparar" aria-multiselectable="true">
          {comparisonOptions.map((process) => {
            const value = String(process.id);
            const checked = comparisons.includes(value);
            const disabled = !checked && comparisons.length >= 3;
            return (
              <label className={styles.comparisonOption} key={process.id}>
                <input
                  type="checkbox"
                  value={value}
                  checked={checked}
                  disabled={disabled}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...comparisons, value].slice(0, 3)
                      : comparisons.filter((id) => id !== value);
                    onChange(primaryId, next);
                  }}
                />
                <span>{process.name}</span>
              </label>
            );
          })}
          <small>Selecciona hasta 3 procesos</small>
        </div>
      </details>
      <button className={styles.resetButton} type="button" onClick={() => onChange(primaryId, [])}>
        ↻ Restablecer
      </button>
    </div>
  );
}
