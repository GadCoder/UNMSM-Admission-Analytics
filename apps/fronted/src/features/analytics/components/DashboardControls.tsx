import { useEffect, useRef, useState } from "react";

import type { AcademicArea, AdmissionProcess, Faculty, Modality } from "../api/analytics.types";
import styles from "../pages/DashboardPage.module.css";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import { formatProcessLabel } from "../utils/processLabels";

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
  onChange: (filters: DashboardFilters) => void;
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
    <section className={styles.processContext} aria-label="Contexto del análisis">
      <div className={styles.primaryProcessControl}>
        <label htmlFor="primary-process">Proceso analizado</label>
        <select id="primary-process" value={primaryId} onChange={(event) => onChange(event.target.value, comparisons)}>
          {processes.map((process) => <option key={process.id} value={process.id}>{formatProcessLabel(process)}</option>)}
        </select>
      </div>
      <div ref={comparisonRef} className={styles.comparisonDisclosure}>
        <div className={styles.comparisonHeader}>
          <span>Comparar con</span>
          <button className={styles.comparisonButton} type="button" aria-expanded={comparisonOpen} aria-label="Añadir proceso para comparar" onClick={() => { setComparisonDraft(comparisons); setComparisonOpen((open) => !open); }}>
            <span>＋ Añadir proceso</span>
            <span className={styles.chevron} aria-hidden="true">⌄</span>
          </button>
        </div>
        {selectedProcesses.length > 0 && <div className={styles.activeComparisons} aria-label="Procesos comparados">
          {selectedProcesses.map((process) => <span className={styles.comparisonChip} key={process.id}>{formatProcessLabel(process)}<button type="button" aria-label={`Quitar comparación ${formatProcessLabel(process)}`} onClick={() => onChange(primaryId, comparisons.filter((id) => id !== String(process.id)))}>×</button></span>)}
        </div>}
        {comparisonOpen && <div className={styles.comparisonMenu} role="dialog" aria-label="Comparar procesos">
          <strong>Comparar con</strong>
          <small>Selecciona hasta 3 procesos adicionales.</small>
          {comparisonOptions.map((process) => {
            const value = String(process.id);
            const checked = comparisonDraft.includes(value);
            const disabled = !checked && comparisonDraft.length >= 3;
            return <label className={styles.comparisonOption} key={process.id}><input type="checkbox" value={value} checked={checked} disabled={disabled} onChange={(event) => setComparisonDraft(event.target.checked ? [...comparisonDraft, value].slice(0, 3) : comparisonDraft.filter((id) => id !== value))} /><span>{formatProcessLabel(process)}</span></label>;
          })}
          <div className={styles.comparisonActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => { setComparisonDraft(comparisons); setComparisonOpen(false); }}>Cancelar</button>
            <button type="button" className={styles.applyButton} onClick={applyComparison}>Aplicar comparación</button>
          </div>
        </div>}
      </div>
    </section>
  );
}

export function DashboardFilterControls({ areas, faculties, modalities, filters, onChange, onReset }: DashboardFilterControlsProps) {
  const filtersRef = useRef<HTMLDetailsElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const debouncedFilters = useDebouncedValue(draftFilters);
  const initialized = useRef(false);
  const selectedArea = areas.find((area) => area.code === draftFilters.academicArea);
  const availableFaculties = selectedArea ? faculties.filter((faculty) => faculty.academic_area_id === selectedArea.id) : faculties;
  const activeFilters = Object.values(draftFilters).filter(Boolean).length;

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    onChange(debouncedFilters);
  }, [debouncedFilters, onChange]);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (filtersOpen && !filtersRef.current?.contains(event.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [filtersOpen]);

  const updateDraftFilter = (key: keyof DashboardFilters, value: string) => setDraftFilters((current) => ({ ...current, [key]: value, ...(key === "academicArea" ? { faculty: "" } : {}) }));

  return <details ref={filtersRef} className={styles.filtersDisclosure} open={filtersOpen} onToggle={(event) => setFiltersOpen(event.currentTarget.open)}>
    <summary
      aria-label={activeFilters > 0 ? `Filtros, ${activeFilters} activos` : "Filtros"}
      title="Abrir filtros"
      onClick={(event) => {
        if (!filtersOpen) {
          event.preventDefault();
          setDraftFilters(filters);
          setFiltersOpen(true);
        }
      }}
    >
      <span className={styles.filterIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><path d="M4 5h16M7 12h10m-7 7h4" /></svg>
      </span>
      <span className={styles.visuallyHidden}>Filtros</span>
      {activeFilters > 0 && <span className={styles.filterBadge} aria-hidden="true">{activeFilters}</span>}
    </summary>
    <div className={styles.filtersPanel}>
      <FilterSelect label="Área académica" value={draftFilters.academicArea} options={areas.map((item) => [item.code, item.name])} onChange={(value) => updateDraftFilter("academicArea", value)} />
      <FilterSelect label="Facultad" value={draftFilters.faculty} options={availableFaculties.map((item) => [item.code, item.name])} onChange={(value) => updateDraftFilter("faculty", value)} />
      <FilterSelect label="Modalidad" value={draftFilters.modality} options={modalities.map((item) => [item.name, item.name])} onChange={(value) => updateDraftFilter("modality", value)} />
      <button className={styles.resetButton} type="button" onClick={() => { onReset(); setDraftFilters({ academicArea: "", faculty: "", modality: "" }); setFiltersOpen(false); }}>↻ Restablecer filtros</button>
    </div>
  </details>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return <div className={styles.control}><label htmlFor={`filter-${label}`}>{label}</label><select id={`filter-${label}`} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Todas</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
}
