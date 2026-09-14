import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { ProcessOverview } from "../api/analytics.types";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import { MajorBreakdownControls } from "./MajorBreakdownControls";
import { MajorPerformanceCards } from "./MajorPerformanceCards";
import { MajorPerformanceTable } from "./MajorPerformanceTable";
import { sortMajors } from "./majorPerformance.utils";
import type { SortDirection, SortKey } from "./majorPerformance.utils";
import styles from "../pages/DashboardPage.module.css";

type MajorBreakdownProps = { overview: ProcessOverview; filterControls?: ReactNode };

export function MajorBreakdown({ overview, filterControls }: MajorBreakdownProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("total_results");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase();

  const filteredMajors = useMemo(() => overview.majors.filter((major) => major.major_name.toLocaleLowerCase().includes(normalizedQuery)), [normalizedQuery, overview.majors]);
  const majors = useMemo(() => sortMajors(filteredMajors, sortKey, sortDirection), [filteredMajors, sortDirection, sortKey]);
  const suggestions = useMemo(() => normalizedQuery ? overview.majors.filter((major) => major.major_name.toLocaleLowerCase().includes(normalizedQuery)) : [], [normalizedQuery, overview.majors]);

  const updateSort = (value: string) => {
    const [nextKey, nextDirection] = value.split("-") as [SortKey, SortDirection];
    setSortKey(nextKey);
    setSortDirection(nextDirection);
  };

  return <section className={styles.card} aria-labelledby="major-breakdown-heading">
    <div className={styles.sectionHeading}>
      <h2 id="major-breakdown-heading">Desempeño por carrera</h2>
      {filterControls}
    </div>
    <MajorBreakdownControls
      query={query}
      suggestionsOpen={suggestionsOpen}
      suggestions={suggestions}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onQueryChange={setQuery}
      onSuggestionsOpenChange={setSuggestionsOpen}
      onSortChange={updateSort}
    />
    <MajorPerformanceCards majors={majors} />
    <MajorPerformanceTable majors={majors} process={overview.process} />
  </section>;
}
