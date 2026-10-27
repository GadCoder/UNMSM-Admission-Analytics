import { useEffect, useMemo, useRef, useState } from "react";

import type { CareerNavigationContext } from "../utils/careerNavigation";
import type { ProcessOverview } from "../api/analytics.types";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import { MajorBreakdownControls } from "./MajorBreakdownControls";
import { MajorBreakdownSortingSkeleton } from "./LoadingSkeletons";
import { MajorPerformanceCards } from "./MajorPerformanceCards";
import { MajorPerformanceTable } from "./MajorPerformanceTable";
import surfaceStyles from "./AnalyticsSurface.module.css";
import { sortMajors } from "./majorPerformance.utils";
import type { SortDirection, SortKey } from "./majorPerformance.utils";
import styles from "../pages/DashboardPage.module.css";
import { AnalyticsSurface } from "./AnalyticsSurface";

const PAGE_SIZE = 10;

type MajorBreakdownProps = { overview: ProcessOverview; navigation?: CareerNavigationContext };

export function MajorBreakdown({ overview, navigation }: MajorBreakdownProps) {
  const [query, setQuery] = useState("");
  const [pageSelection, setPageSelection] = useState({ processId: overview.process.id, page: 1 });
  const page = pageSelection.processId === overview.process.id ? pageSelection.page : 1;
  const setPage = (nextPage: number) => setPageSelection({ processId: overview.process.id, page: nextPage });
  const debouncedQuery = useDebouncedValue(query);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("total_results");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isSorting, setIsSorting] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const sortTimer = useRef<number | null>(null);
  const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase();

  const filteredMajors = useMemo(() => overview.majors.filter((major) => major.major_name.toLocaleLowerCase().includes(normalizedQuery)), [normalizedQuery, overview.majors]);
  const majors = useMemo(() => sortMajors(filteredMajors, sortKey, sortDirection), [filteredMajors, sortDirection, sortKey]);
  const suggestions = useMemo(() => normalizedQuery ? overview.majors.filter((major) => major.major_name.toLocaleLowerCase().includes(normalizedQuery)) : [], [normalizedQuery, overview.majors]);
  const pageCount = Math.ceil(majors.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const rankOffset = (currentPage - 1) * PAGE_SIZE;
  const visibleMajors = majors.slice(rankOffset, rankOffset + PAGE_SIZE);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateSort = (value: string) => {
    const [nextKey, nextDirection] = value.split("-") as [SortKey, SortDirection];
    setPage(1);
    if (sortTimer.current !== null) window.clearTimeout(sortTimer.current);
    setContentHeight(contentRef.current?.offsetHeight ?? 0);
    setIsSorting(true);
    sortTimer.current = window.setTimeout(() => {
      setSortKey(nextKey);
      setSortDirection(nextDirection);
      setIsSorting(false);
      sortTimer.current = null;
    }, 350);
  };

  const updateSortByKey = (key: SortKey) => {
    const direction = sortKey === key
      ? sortDirection === "asc" ? "desc" : "asc"
      : key === "major_name" ? "asc" : "desc";
    updateSort(`${key}-${direction}`);
  };

  useEffect(() => () => {
    if (sortTimer.current !== null) window.clearTimeout(sortTimer.current);
  }, []);

  return <AnalyticsSurface className={styles.majorBreakdownSurface} aria-labelledby="major-breakdown-heading">
    <div className={styles.sectionHeading}>
      <h2 id="major-breakdown-heading" className={surfaceStyles.sectionTitle}>Desempeño por carrera</h2>
    </div>
    <MajorBreakdownControls
      query={query}
      suggestionsOpen={suggestionsOpen}
      suggestions={suggestions}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onQueryChange={updateQuery}
      onSuggestionsOpenChange={setSuggestionsOpen}
      onSortChange={updateSort}
    />
    <div ref={contentRef} style={isSorting && contentHeight ? { minHeight: `${contentHeight}px` } : undefined}>
      {isSorting ? <MajorBreakdownSortingSkeleton /> : <>
        <MajorPerformanceCards majors={visibleMajors} processId={overview.process.id} navigation={navigation} rankOffset={rankOffset} />
        <MajorPerformanceTable
          majors={visibleMajors}
          process={overview.process}
          navigation={navigation}
          rankOffset={rankOffset}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={updateSortByKey}
        />
      </>}
    </div>
    {pageCount > 1 && <nav className={styles.majorPagination} aria-label="Paginación de carreras">
      <p aria-live="polite">Mostrando {rankOffset + 1}–{Math.min(rankOffset + PAGE_SIZE, majors.length)} de {majors.length} carreras · Página {currentPage} de {pageCount}</p>
      <div>
        <button type="button" onClick={() => setPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}>Anterior</button>
        <button type="button" onClick={() => setPage(Math.min(currentPage + 1, pageCount))} disabled={currentPage === pageCount}>Siguiente</button>
      </div>
    </nav>}
  </AnalyticsSurface>;
}
