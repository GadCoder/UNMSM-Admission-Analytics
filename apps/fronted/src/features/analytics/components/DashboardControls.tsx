import type { AdmissionProcess } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "./DashboardControls.module.css";

export type { DashboardFilters, DashboardFilterControlsProps } from "./DashboardFilterControls";
export { DashboardFilterControls } from "./DashboardFilterControls";

export type DashboardControlsProps = {
  processes: AdmissionProcess[];
  primaryId: string;
  onChange: (process: string) => void;
};

export function DashboardControls({ processes, primaryId, onChange }: DashboardControlsProps) {
  return <div className={styles.processControls} role="group" aria-label="Selección del proceso">
    <div className={styles.primaryControl}>
      <label className={styles.primaryLabel} htmlFor="primary-process">Proceso</label>
      <select className={styles.primarySelect} id="primary-process" aria-label="Proceso analizado" value={primaryId} onChange={(event) => onChange(event.target.value)}>
        {processes.map((process) => <option key={process.id} value={process.id}>{formatProcessLabel(process)}</option>)}
      </select>
    </div>
  </div>;
}
