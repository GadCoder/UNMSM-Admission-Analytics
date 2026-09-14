import type { MajorOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import type { SortDirection, SortKey } from "./majorPerformance.utils";
import styles from "../pages/DashboardPage.module.css";

type MajorBreakdownControlsProps = {
  query: string;
  suggestionsOpen: boolean;
  suggestions: MajorOverview[];
  sortKey: SortKey;
  sortDirection: SortDirection;
  onQueryChange: (value: string) => void;
  onSuggestionsOpenChange: (open: boolean) => void;
  onSortChange: (value: string) => void;
};

export function MajorBreakdownControls({ query, suggestionsOpen, suggestions, sortKey, sortDirection, onQueryChange, onSuggestionsOpenChange, onSortChange }: MajorBreakdownControlsProps) {
  return <div className={styles.tableControls} aria-label="Filtros y orden de carreras">
    <label className={styles.tableFilter}><span>Filtrar carreras</span><div className={styles.autocomplete}>
      <input
        type="search"
        aria-label="Filtrar carreras"
        aria-autocomplete="list"
        aria-controls="major-suggestions"
        aria-expanded={suggestionsOpen && suggestions.length > 0}
        placeholder="Busca por nombre"
        value={query}
        onFocus={() => onSuggestionsOpenChange(true)}
        onBlur={() => window.setTimeout(() => onSuggestionsOpenChange(false), 120)}
        onKeyDown={(event) => { if (event.key === "Escape") onSuggestionsOpenChange(false); }}
        onChange={(event) => { onQueryChange(event.target.value); onSuggestionsOpenChange(true); }}
      />
      {suggestionsOpen && suggestions.length > 0 && <ul id="major-suggestions" className={styles.suggestions} role="listbox" aria-label="Carreras coincidentes">
        {suggestions.map((major) => <li key={major.major_id} role="option" aria-selected={false}>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onQueryChange(major.major_name); onSuggestionsOpenChange(false); }}>
            <span>{major.major_name}</span><small>{formatNumber(major.total_results)} postulantes</small>
          </button>
        </li>)}
      </ul>}
    </div></label>
    <label className={styles.tableSort}><span>Ordenar carreras</span><select aria-label="Ordenar carreras" value={`${sortKey}-${sortDirection}`} onChange={(event) => onSortChange(event.target.value)}>
      <option value="total_results-desc">Más postulantes</option><option value="total_results-asc">Menos postulantes</option>
      <option value="admitted_count-desc">Más admitidos</option><option value="admitted_count-asc">Menos admitidos</option>
      <option value="admission_rate-desc">Mayor tasa de admisión</option><option value="admission_rate-asc">Menor tasa de admisión</option>
      <option value="average_score-desc">Mayor promedio</option><option value="average_score-asc">Menor promedio</option>
      <option value="major_name-asc">Nombre de carrera (A-Z)</option><option value="major_name-desc">Nombre de carrera (Z-A)</option>
    </select></label>
  </div>;
}
