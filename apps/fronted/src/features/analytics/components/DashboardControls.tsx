import { useEffect, useRef, useState } from "react";

import type { AcademicArea, AdmissionProcess, Faculty, Modality } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";

export type DashboardFilters = { academicArea: string; faculty: string; modality: string };
type DashboardControlsProps = {
  processes: AdmissionProcess[];
  primaryId: string;
  comparisons: string[];
  onChange: (process: string, comparisons: string[]) => void;
};
export type DashboardFilterControlsProps = {
  areas: AcademicArea[];
  faculties: Faculty[];
  modalities: Modality[];
  filters: DashboardFilters;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onReset: () => void;
};

export function DashboardControls({ processes, primaryId, comparisons, onChange }: DashboardControlsProps) {
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonDraft, setComparisonDraft] = useState(comparisons);
  const comparisonOptions = processes.filter((process) => String(process.id) !== primaryId);
  const selectedProcesses = comparisonOptions.filter((process) => comparisons.includes(String(process.id)));


  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (comparisonOpen && !comparisonRef.current?.contains(event.target as Node)) setComparisonOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [comparisonOpen]);

  const applyComparison = () => {
    onChange(primaryId, comparisonDraft);
    setComparisonOpen(false);
  };

  return (
    <div className={styles.controls} aria-label="Selección de procesos">
      <div className={`${styles.control} ${styles.primaryControl}`}>
        <label htmlFor="primary-process">Proceso</label>
        <select id="primary-process" value={primaryId} onChange={(event) => onChange(event.target.value, comparisons)}>
          {processes.map((process) => <option key={process.id} value={process.id}>{process.name}</option>)}
        </select>
      </div>
      <div ref={comparisonRef} className={styles.comparisonDisclosure}>
        <button className={styles.comparisonButton} type="button" aria-expanded={comparisonOpen} onClick={() => { setComparisonDraft(comparisons); setComparisonOpen((open) => !open); }}>
          <span>{selectedProcesses.length ? `Comparando ${selectedProcesses.length} proceso${selectedProcesses.length === 1 ? "" : "s"}` : "＋ Comparar procesos"}</span>
          <span className={styles.chevron} aria-hidden="true">⌄</span>
        </button>
        {comparisonOpen && <div className={styles.comparisonMenu} role="dialog" aria-label="Comparar procesos">
          <strong>Comparar procesos</strong>
          <small>Selecciona hasta 3 procesos</small>
          {comparisonOptions.map((process) => {
            const value = String(process.id);
            const checked = comparisonDraft.includes(value);
            const disabled = !checked && comparisonDraft.length >= 3;
            return <label className={styles.comparisonOption} key={process.id}><input type="checkbox" value={value} checked={checked} disabled={disabled} onChange={(event) => setComparisonDraft(event.target.checked ? [...comparisonDraft, value].slice(0, 3) : comparisonDraft.filter((id) => id !== value))} /><span>{process.name}</span></label>;
          })}
          <div className={styles.comparisonActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => { setComparisonDraft(comparisons); setComparisonOpen(false); }}>Cancelar</button>
            <button type="button" className={styles.applyButton} onClick={applyComparison}>Aplicar comparación</button>
          </div>
        </div>}
      </div>
      {selectedProcesses.length > 0 && <div className={styles.activeComparisons} aria-label="Procesos comparados">
        {selectedProcesses.map((process) => <span className={styles.comparisonChip} key={process.id}>{process.name}<button type="button" aria-label={`Quitar comparación ${process.name}`} onClick={() => onChange(primaryId, comparisons.filter((id) => id !== String(process.id)))}>×</button></span>)}
      </div>}
    </div>
  );
}

export function DashboardFilterControls({ areas, faculties, modalities, filters, onFilterChange, onReset }: DashboardFilterControlsProps) {
  const filtersRef = useRef<HTMLDetailsElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const selectedArea = areas.find((area) => area.code === filters.academicArea);
  const availableFaculties = selectedArea ? faculties.filter((faculty) => faculty.academic_area_id === selectedArea.id) : faculties;
  const activeFilters = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (filtersOpen && !filtersRef.current?.contains(event.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [filtersOpen]);

  return <details ref={filtersRef} className={styles.filtersDisclosure} open={filtersOpen} onToggle={(event) => setFiltersOpen(event.currentTarget.open)}>
    <summary><span>Filtros</span>{activeFilters > 0 && <small>{activeFilters} activos</small>}<span className={styles.chevron} aria-hidden="true">⌄</span></summary>
    <div className={styles.filtersPanel}>
      <FilterSelect label="Área académica" value={filters.academicArea} options={areas.map((item) => [item.code, item.name])} onChange={(value) => onFilterChange("academicArea", value)} />
      <FilterSelect label="Facultad" value={filters.faculty} options={availableFaculties.map((item) => [item.code, item.name])} onChange={(value) => onFilterChange("faculty", value)} />
      <FilterSelect label="Modalidad" value={filters.modality} options={modalities.map((item) => [item.name, item.name])} onChange={(value) => onFilterChange("modality", value)} />
      <button className={styles.resetButton} type="button" onClick={onReset}>↻ Restablecer filtros</button>
    </div>
  </details>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return <div className={styles.control}><label htmlFor={`filter-${label}`}>{label}</label><select id={`filter-${label}`} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Todas</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
}
