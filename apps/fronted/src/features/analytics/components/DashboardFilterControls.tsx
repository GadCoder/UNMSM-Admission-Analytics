import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { AcademicArea, Faculty, Modality } from "../api/analytics.types";
import {
  DEFAULT_ADMISSION_MODALITY,
  formatAdmissionModalityLabel,
} from "../utils/admissionModality";
import { ResponsiveControlPanel } from "./ResponsiveControlPanel";
import { SelectField } from "./SelectField";
import styles from "./DashboardFilterControls.module.css";

export type DashboardFilters = { academicArea: string; faculty: string; modality: string };
export type DashboardFilterControlsProps = {
  areas: AcademicArea[];
  faculties: Faculty[];
  modalities?: Modality[];
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  onReset: () => void;
};

const emptyFilters = (): DashboardFilters => ({
  academicArea: "",
  faculty: "",
  modality: DEFAULT_ADMISSION_MODALITY,
});
const sameFilters = (a: DashboardFilters, b: DashboardFilters) =>
  a.academicArea === b.academicArea && a.faculty === b.faculty && a.modality === b.modality;

export function DashboardFilterControls({
  areas,
  faculties,
  modalities = [],
  filters,
  onChange,
  onReset,
}: DashboardFilterControlsProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  const lastEmittedRef = useRef<DashboardFilters | null>(null);
  const incomingRef = useRef(filters);
  const draftRef = useRef(filters);
  const [open, setOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Parent updates can come from chips, reset controls, or navigation. Treat them as
  // authoritative unless they are simply echoing the last debounced update.
  useEffect(() => {
    if (sameFilters(filters, incomingRef.current)) return;
    incomingRef.current = filters;
    if (lastEmittedRef.current && sameFilters(filters, lastEmittedRef.current)) {
      lastEmittedRef.current = null;
      return;
    }
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    lastEmittedRef.current = null;
    if (!sameFilters(filters, draftRef.current)) {
      draftRef.current = filters;
      setDraftFilters(filters);
    }
  }, [filters]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const commitLater = (next: DashboardFilters) => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      lastEmittedRef.current = next;
      onChangeRef.current(next);
    }, 400);
  };

  const updateFilter = (key: keyof DashboardFilters, value: string) => {
    const current = draftRef.current;
    const next = {
      ...current,
      [key]: value,
      ...(key === "academicArea" ? { faculty: "" } : {}),
    };
    draftRef.current = next;
    setDraftFilters(next);
    commitLater(next);
  };

  const reset = () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    lastEmittedRef.current = null;
    const cleared = emptyFilters();
    draftRef.current = cleared;
    setDraftFilters(cleared);
    onReset();
    setOpen(false);
  };

  const selectedArea = areas.find((area) => area.code === draftFilters.academicArea);
  const availableFaculties = selectedArea
    ? faculties.filter((faculty) => faculty.academic_area_id === selectedArea.id)
    : faculties;
  const activeCount = [filters.academicArea, filters.faculty].filter(Boolean).length;
  const modalityOptions = modalities.map((item) => [
    item.name,
    formatAdmissionModalityLabel(item.name),
  ]);
  const allModalityOptions = modalityOptions.some(([value]) => value === filters.modality)
    ? modalityOptions
    : [[filters.modality, formatAdmissionModalityLabel(filters.modality)], ...modalityOptions];

  return (
    <div className={styles.wrapper} role="group" aria-label="Filtros de carreras">
      {!open && (
        <div className={styles.desktopFields}>
          <FilterSelect
            idSuffix="desktop-area"
            label="Área académica"
            value={draftFilters.academicArea}
            options={areas.map((item) => [item.code, item.name])}
            onChange={(value) => updateFilter("academicArea", value)}
          />
          <FilterSelect
            idSuffix="desktop-faculty"
            label="Facultad"
            value={draftFilters.faculty}
            options={availableFaculties.map((item) => [item.code, item.name])}
            onChange={(value) => updateFilter("faculty", value)}
          />
        </div>
      )}
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          activeCount > 0
            ? `Abrir filtros de carreras, ${activeCount} ${activeCount === 1 ? "filtro activo" : "filtros activos"}`
            : "Abrir filtros de carreras"
        }
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h16M7 12h10m-7 7h4" />
        </svg>
        <span>Filtros{activeCount > 0 ? ` (${activeCount})` : ""}</span>
      </button>
      <ResponsiveControlPanel
        open={open}
        onClose={() => setOpen(false)}
        title="Filtrar resultados"
        triggerRef={triggerRef}
        footer={
          <button className={styles.reset} type="button" onClick={reset}>
            ↻ Restablecer filtros
          </button>
        }
      >
        <div className={styles.fields}>
          <FilterSelect
            idSuffix="mobile-area"
            label="Área académica"
            value={draftFilters.academicArea}
            options={areas.map((item) => [item.code, item.name])}
            onChange={(value) => updateFilter("academicArea", value)}
          />
          <FilterSelect
            idSuffix="mobile-faculty"
            label="Facultad"
            value={draftFilters.faculty}
            options={availableFaculties.map((item) => [item.code, item.name])}
            onChange={(value) => updateFilter("faculty", value)}
          />
          <FilterSelect
            idSuffix="mobile-modality"
            label="Modalidad"
            value={draftFilters.modality}
            options={allModalityOptions}
            includeAll={false}
            onChange={(value) => updateFilter("modality", value)}
          />
        </div>
      </ResponsiveControlPanel>
    </div>
  );
}

function FilterSelect({
  idSuffix,
  label,
  value,
  options,
  includeAll = true,
  onChange,
}: {
  idSuffix: string;
  label: string;
  value: string;
  options: string[][];
  includeAll?: boolean;
  onChange: (value: string) => void;
}) {
  const id = `dashboard-filter-${idSuffix}`;
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {includeAll && <option value="">Todas</option>}
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </SelectField>
  );
}
