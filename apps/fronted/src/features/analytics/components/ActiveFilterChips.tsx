import type { AcademicArea, Faculty } from "../api/analytics.types";
import type { DashboardFilters } from "./DashboardFilterControls";
import { RemovableChip } from "./RemovableChip";
import styles from "./ResultsControls.module.css";

type ActiveFilterChipsProps = {
  filters: DashboardFilters;
  areas: AcademicArea[];
  faculties: Faculty[];
  onChange: (filters: DashboardFilters) => void;
};

export function ActiveFilterChips({ filters, areas, faculties, onChange }: ActiveFilterChipsProps) {
  const selections = [
    {
      key: "academicArea" as const,
      field: "Área académica",
      value: filters.academicArea,
      label: areas.find((area) => area.code === filters.academicArea)?.name ?? filters.academicArea,
    },
    {
      key: "faculty" as const,
      field: "Facultad",
      value: filters.faculty,
      label: faculties.find((faculty) => faculty.code === filters.faculty)?.name ?? filters.faculty,
    },
  ].filter((selection) => selection.value);

  if (!selections.length) return null;

  return (
    <ul className={styles.chips} aria-label="Filtros activos">
      {selections.map(({ key, field, label }) => (
        <li key={key}>
          <RemovableChip
            label={label}
            accessibleName={`Quitar filtro ${field}: ${label}`}
            title={`${field}: ${label}`}
            onRemove={() =>
              onChange({
                ...filters,
                [key]: "",
                ...(key === "academicArea" ? { faculty: "" } : {}),
              })
            }
          />
        </li>
      ))}
    </ul>
  );
}
