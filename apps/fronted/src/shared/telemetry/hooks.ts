import { useEffect, useRef } from "react";
import { trackUsage, type UsagePage } from "./usage";

/** One event per observed context, not per refetch or React rerender. */
export function useCareerView(
  majorId: string,
  processId: string,
  modality: string,
  ready: boolean,
) {
  const last = useRef("");
  useEffect(() => {
    if (!ready) return;
    const key = JSON.stringify([majorId, processId, modality]);
    if (last.current === key) return;
    last.current = key;
    trackUsage("career_viewed", { major_id: majorId, process_id: processId, modality });
  }, [majorId, processId, modality, ready]);
}

/** Emit after 600ms without a search change; text remains exclusively in memory. */
export function useSearchUsage(
  query: string,
  resultCount: number,
  ready: boolean,
  page: UsagePage,
) {
  const last = useRef("");
  useEffect(() => {
    if (!query.trim()) {
      last.current = "";
      return;
    }
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const key = JSON.stringify([query, resultCount, page]);
      if (last.current === key) return;
      last.current = key;
      trackUsage("search_completed", { page, result_count: String(resultCount) });
      if (resultCount === 0) trackUsage("results_empty", { page });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [query, resultCount, ready, page]);
}
