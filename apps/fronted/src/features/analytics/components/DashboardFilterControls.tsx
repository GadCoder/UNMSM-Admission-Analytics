import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { AcademicArea, Faculty, Modality } from "../api/analytics.types";
import {
  DEFAULT_ADMISSION_MODALITY,
  formatAdmissionModalityLabel,
} from "../utils/admissionModality";
import { ResponsiveFilterControls } from "./ResponsiveFilterControls";
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
  const timerRef = useRef<number | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  const lastEmittedRef = useRef<DashboardFilters | null>(null);
  const incomingRef = useRef(filters);
  const draftRef = useRef(filters);
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

  return (
    <ResponsiveFilterControls
      label="Filtros de carreras"
      title="Filtrar resultados"
      triggerLabel="Abrir filtros de carreras"
      activeCount={activeCount}
      desktopContent={
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
      }
      footer={(close) => (
        <button
          className={styles.reset}
          type="button"
          onClick={() => {
            reset();
            close();
          }}
        >
          ↻ Restablecer filtros
        </button>
      )}
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
          options={modalityOptions}
          includeAll={false}
          onChange={(value) => updateFilter("modality", value)}
        />
      </div>
    </ResponsiveFilterControls>
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
