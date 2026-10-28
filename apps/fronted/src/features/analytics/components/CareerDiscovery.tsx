import { useMemo, useRef, type KeyboardEvent, type ReactNode } from "react";

import type { CareerNavigationContext } from "../utils/careerNavigation";
import type { ProcessOverview } from "../api/analytics.types";
import { PageBanner } from "./PageBanner";
import { CareerResults } from "./CareerResults";
import { CareerSearch } from "./CareerSearch";
import styles from "./CareerDiscovery.module.css";

export type CareerDiscoveryProps = {
  overview?: ProcessOverview;
  processId: string;
  navigation: CareerNavigationContext;
  query: string;
  onQueryChange: (query: string) => void;
  showAll: boolean;
  onShowAllChange: (showAll: boolean) => void;
  status?: "ready" | "loading" | "error";
  onRetry?: () => void;
  filters?: ReactNode;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();

export function CareerDiscovery({
  overview,
  processId,
  navigation,
  query,
  onQueryChange,
  showAll,
  onShowAllChange,
  status = "ready",
  onRetry,
  filters,
}: CareerDiscoveryProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultLinkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const majors = useMemo(
    () =>
      [...(overview?.majors ?? [])].sort(
        (a, b) =>
          b.total_results - a.total_results ||
          a.major_name.localeCompare(b.major_name, "es") ||
          a.major_id - b.major_id,
      ),
    [overview?.majors],
  );
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = terms.length
    ? majors.filter((major) => {
        const name = normalize(major.major_name);
        return terms.every((term) => name.includes(term));
      })
    : [];
  const hasQuery = terms.length > 0;

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && matches.length) {
      event.preventDefault();
      resultLinkRefs.current[event.key === "ArrowDown" ? 0 : matches.length - 1]?.focus();
    }
  };

  const handleResultKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  return (
    <div className={styles.discoveryLayout}>
      <PageBanner
        eyebrow="Explora tus opciones"
        title="Encuentra tu carrera"
        titleId="career-discovery-title"
        description="Explora carreras y consulta sus resultados de admisión."
        filters={filters}
      />
      <section className={styles.discoveryPanel} aria-label="Búsqueda y carreras populares">
        <CareerSearch
          query={query}
          status={status}
          inputRef={searchInputRef}
          onQueryChange={onQueryChange}
          onKeyDown={handleSearchKeyDown}
          onRetry={onRetry}
        />
        {status === "ready" && (
          <CareerResults
            majors={hasQuery ? matches : majors}
            hasQuery={hasQuery}
            query={query}
            processId={processId}
            navigation={navigation}
            showAll={showAll}
            resultLinkRefs={resultLinkRefs}
            onShowAllChange={onShowAllChange}
            onResultKeyDown={handleResultKeyDown}
          />
        )}
      </section>
    </div>
  );
}
