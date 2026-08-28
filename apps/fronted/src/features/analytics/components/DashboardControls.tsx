import type { AcademicArea, AdmissionProcess, Faculty, Modality } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";

type DashboardControlsProps = {
  processes: AdmissionProcess[]; primaryId: string; comparisons: string[];
  areas: AcademicArea[]; faculties: Faculty[]; modalities: Modality[];
  filters: { academicArea: string; faculty: string; modality: string };
  onChange: (process: string, comparisons: string[]) => void;
  onFilterChange: (key: "academicArea" | "faculty" | "modality", value: string) => void;
};

export function DashboardControls({ processes, primaryId, comparisons, areas, faculties, modalities, filters, onChange, onFilterChange }: DashboardControlsProps) {
  const comparisonOptions = processes.filter((process) => String(process.id) !== primaryId);
  const selectedProcesses = comparisonOptions.filter((process) => comparisons.includes(String(process.id)));
  const comparisonSummary = selectedProcesses.length === 1 ? selectedProcesses[0].name : selectedProcesses.length ? `${selectedProcesses.length} procesos seleccionados` : "Selecciona procesos";
  return (
    <div className={styles.controls} aria-label="Selección de procesos y filtros">
      <div className={styles.control}><label htmlFor="primary-process">Proceso</label><select id="primary-process" value={primaryId} onChange={(event) => onChange(event.target.value, comparisons)}>{processes.map((process) => <option key={process.id} value={process.id}>{process.name}</option>)}</select></div>
      <details className={`${styles.control} ${styles.comparisonControl}`}><summary><span className={styles.controlLabel}>Comparar con</span><span className={styles.comparisonValue}>{comparisonSummary}</span><span className={styles.chevron} aria-hidden="true">⌄</span></summary><div className={styles.comparisonMenu} role="listbox" aria-label="Procesos para comparar" aria-multiselectable="true">{comparisonOptions.map((process) => { const value = String(process.id); const checked = comparisons.includes(value); const disabled = !checked && comparisons.length >= 3; return <label className={styles.comparisonOption} key={process.id}><input type="checkbox" value={value} checked={checked} disabled={disabled} onChange={(event) => onChange(primaryId, event.target.checked ? [...comparisons, value].slice(0, 3) : comparisons.filter((id) => id !== value))} /><span>{process.name}</span></label>; })}<small>Selecciona hasta 3 procesos</small></div></details>
      <FilterSelect label="Área académica" value={filters.academicArea} options={areas.map((item) => [item.code, item.name])} onChange={(value) => onFilterChange("academicArea", value)} />
      <FilterSelect label="Facultad" value={filters.faculty} options={faculties.map((item) => [item.code, item.name])} onChange={(value) => onFilterChange("faculty", value)} />
      <FilterSelect label="Modalidad" value={filters.modality} options={modalities.map((item) => [item.name, item.name])} onChange={(value) => onFilterChange("modality", value)} />
      <button className={styles.resetButton} type="button" onClick={() => onChange(primaryId, [])}>↻ Restablecer comparación</button>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return <div className={styles.control}><label htmlFor={`filter-${label}`}>{label}</label><select id={`filter-${label}`} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Todas</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
}
