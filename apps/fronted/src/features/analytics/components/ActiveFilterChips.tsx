import type { AcademicArea, Faculty, Modality } from "../api/analytics.types";
import type { DashboardFilters } from "./DashboardFilterControls";
import styles from "./ResultsControls.module.css";

type ActiveFilterChipsProps = {
  filters: DashboardFilters;
  areas: AcademicArea[];
  faculties: Faculty[];
  modalities: Modality[];
  onChange: (filters: DashboardFilters) => void;
};

export function ActiveFilterChips({ filters, areas, faculties, modalities, onChange }: ActiveFilterChipsProps) {
  const selections = [
    { key: "academicArea" as const, field: "Área académica", value: filters.academicArea, label: areas.find((area) => area.code === filters.academicArea)?.name ?? filters.academicArea },
    { key: "faculty" as const, field: "Facultad", value: filters.faculty, label: faculties.find((faculty) => faculty.code === filters.faculty)?.name ?? filters.faculty },
    { key: "modality" as const, field: "Modalidad", value: filters.modality, label: modalities.find((modality) => modality.name === filters.modality)?.name ?? filters.modality },
  ].filter((selection) => selection.value);

  if (!selections.length) return null;

  return (
    <ul className={styles.chips} aria-label="Filtros activos">
      {selections.map(({ key, field, label }) => (
        <li key={key}>
          <button type="button" className={styles.chip} aria-label={`Quitar filtro ${field}: ${label}`} title={`${field}: ${label}`} onClick={() => onChange({ ...filters, [key]: "", ...(key === "academicArea" ? { faculty: "" } : {}) })}>
            <span>{label}</span><span aria-hidden="true">×</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
