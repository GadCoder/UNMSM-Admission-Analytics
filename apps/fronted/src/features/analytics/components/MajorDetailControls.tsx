import { useState } from "react";

import type { AdmissionProcess } from "../api/analytics.types";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";

type MajorDetailControlsProps = {
  processes: AdmissionProcess[];
  primary: string;
  comparisons: string[];
  onPrimaryChange: (value: string) => void;
  onComparisonChange: (processId: string, checked: boolean) => void;
};

export function MajorDetailControls({
  processes,
  primary,
  comparisons,
  onPrimaryChange,
  onComparisonChange,
}: MajorDetailControlsProps) {
  const [isOpen, setIsOpen] = useState(comparisons.length > 0);

  return <div className={`${styles.controls} ${styles.detailControls}`}>
    <div className={`${styles.control} ${styles.primaryControl}`}>
      <label htmlFor="detail-primary-process">Proceso principal</label>
      <select id="detail-primary-process" value={primary} onChange={(event) => onPrimaryChange(event.target.value)}>
        {processes.map((process) => <option key={process.id} value={process.id}>{formatProcessLabel(process)}</option>)}
      </select>
    </div>
    <details className={styles.comparisonDisclosure} open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className={styles.comparisonButton}>Comparar procesos <span aria-hidden="true">⌄</span></summary>
      <div className={styles.comparisonMenu}>
        <strong>Procesos para comparar</strong>
        <small>Selecciona hasta tres procesos adicionales.</small>
        {processes.map((process) => {
          const processId = String(process.id);
          const checked = comparisons.includes(processId);
          return <label className={styles.comparisonOption} key={process.id}>
            <input
              type="checkbox"
              checked={checked}
              disabled={processId === primary || (!checked && comparisons.length >= 3)}
              onChange={(event) => {
                if (event.target.checked) setIsOpen(true);
                onComparisonChange(processId, event.target.checked);
              }}
            />
            <span>{formatProcessLabel(process)}</span>
          </label>;
        })}
      </div>
    </details>
  </div>;
}
