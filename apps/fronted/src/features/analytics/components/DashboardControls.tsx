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
  return (
    <div className={styles.controls} aria-label="Selección de procesos">
      <label htmlFor="primary-process">
        Proceso principal
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
      </label>
      <label htmlFor="comparison-processes">
        Comparar con
        <select
          id="comparison-processes"
          multiple
          value={comparisons}
          onChange={(event) =>
            onChange(
              primaryId,
              Array.from(event.target.selectedOptions, (option) => option.value),
            )
          }
        >
          {processes
            .filter((process) => String(process.id) !== primaryId)
            .map((process) => (
              <option key={process.id} value={process.id}>
                {process.name}
              </option>
            ))}
        </select>
        <small>Selecciona hasta 3 procesos.</small>
      </label>
    </div>
  );
}
