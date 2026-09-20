import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import * as api from "../api/analytics";
import { DashboardContent } from "../components/DashboardContent";
import { DashboardControls, DashboardFilterControls } from "../components/DashboardControls";
import { DashboardLoadingSkeleton, DashboardOverviewLoadingSkeleton } from "../components/LoadingSkeletons";
import { emptyDashboardView, readDashboardView, saveDashboardView, type DashboardView } from "../utils/dashboardSessionState";
import styles from "./DashboardPage.module.css";

const FILTER_PARAM_NAMES = ["academic_area", "faculty", "modality"] as const;

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [savedView, setSavedView] = useState<DashboardView>(readDashboardView);
  const [primaryOverride, setPrimaryOverride] = useState<string | null>(null);
  const migratedParamsRef = useRef<string | null>(null);
  const initializedProcessRef = useRef(false);
  const processesQuery = api.usePublishedProcesses();
  const processes = processesQuery.data ?? [];
  const areasQuery = api.useAcademicAreas();
  const facultiesQuery = api.useFaculties();
  const modalitiesQuery = api.useModalities();
  const filters = {
    academicArea: params.get("academic_area") ?? savedView.filters.academicArea,
    faculty: params.get("faculty") ?? savedView.filters.faculty,
    modality: params.get("modality") ?? savedView.filters.modality,
  };
  const latest = processes[0];
  const primaryId = primaryOverride ?? params.get("process") ?? (latest ? String(latest.id) : "");
  const comparisonParam = params.get("compare");
  const requestedComparisons = (comparisonParam !== null ? comparisonParam.split(",").filter(Boolean) : savedView.comparisons)
    .filter((id) => id !== primaryId)
    .slice(0, 3);
  const primaryIndex = processes.findIndex((process) => String(process.id) === primaryId);
  const previousProcess = primaryIndex >= 0 ? processes[primaryIndex + 1] : undefined;
  const previousId = previousProcess ? String(previousProcess.id) : "";
  const automaticComparison = previousId && !requestedComparisons.includes(previousId) ? [previousId] : [];
  const overviewComparisons = [...requestedComparisons, ...automaticComparison].slice(0, 3);

  useEffect(() => {
    if (latest && !params.get("process") && !initializedProcessRef.current) {
      initializedProcessRef.current = true;
      const next = new URLSearchParams(params);
      next.set("process", String(latest.id));
      setParams(next, { replace: true });
    }
  }, [latest, params, setParams]);

  useEffect(() => {
    const hasLegacyViewParams = comparisonParam !== null || FILTER_PARAM_NAMES.some((name) => params.has(name));
    if (!hasLegacyViewParams) return;
    const paramsKey = params.toString();
    if (migratedParamsRef.current === paramsKey) return;
    migratedParamsRef.current = paramsKey;

    const migratedView = {
      comparisons: requestedComparisons,
      filters: {
        academicArea: params.get("academic_area") ?? savedView.filters.academicArea,
        faculty: params.get("faculty") ?? savedView.filters.faculty,
        modality: params.get("modality") ?? savedView.filters.modality,
      },
    };
    setSavedView(migratedView);
    saveDashboardView(migratedView);
    const next = new URLSearchParams(params);
    next.delete("compare");
    FILTER_PARAM_NAMES.forEach((name) => next.delete(name));
    setParams(next, { replace: true });
  }, [comparisonParam, params, requestedComparisons, savedView, setParams]);

  const overviewQuery = api.useAnalyticsOverview(primaryId, overviewComparisons, filters);
  const selected = overviewQuery.data?.processes ?? [];
  const primary = selected[0];
  const previous = selected.find((item) => String(item.process.id) === previousId);
  const selectedComparisons = selected.slice(1).filter((item) => requestedComparisons.includes(String(item.process.id)));


  const updateSelection = (process: string, compare: string[]) => {
    setPrimaryOverride(process || null);
    const next = new URLSearchParams(process ? { process } : {});

    const safeCompare = compare.filter((id) => id !== process).slice(0, 3);
    const nextView = { ...savedView, comparisons: safeCompare };
    setSavedView(nextView);
    saveDashboardView(nextView);
    next.delete("compare");
    FILTER_PARAM_NAMES.forEach((name) => next.delete(name));
    navigate(`${location.pathname}?${next.toString()}`);
  };

  const updateFilters = useCallback((nextFilters: { academicArea: string; faculty: string; modality: string }) => {
    const next = new URLSearchParams(primaryId ? { process: primaryId } : {});
    const filterParams = { academicArea: "academic_area", faculty: "faculty", modality: "modality" } as const;
    (Object.keys(filterParams) as Array<keyof typeof filterParams>).forEach((key) => {
      const value = nextFilters[key];
      if (value) next.set(filterParams[key], value); else next.delete(filterParams[key]);
    });
    const nextView = { comparisons: savedView.comparisons, filters: nextFilters };
    setSavedView(nextView);
    saveDashboardView(nextView);
    FILTER_PARAM_NAMES.forEach((name) => next.delete(name));
    next.delete("compare");
    setParams(next);
  }, [primaryId, savedView.comparisons, setParams]);

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1>Resultados de admisión</h1>
          <p className={styles.intro}>Consulta los resultados de cada proceso: postulantes, ingresantes y demanda por carrera.</p>
        </div>
        {processes.length > 0 && (
          <DashboardControls
            processes={processes}
            primaryId={primaryId}
            comparisons={requestedComparisons}
            onChange={updateSelection}
          />
        )}
      </div>

      {processesQuery.isPending && <DashboardLoadingSkeleton />}
      {processesQuery.isError && (
        <p role="alert" className={styles.state}>No pudimos cargar los procesos. Intenta nuevamente.</p>
      )}
      {!processesQuery.isPending && !processesQuery.isError && processes.length === 0 && (
        <p className={styles.state}>Aún no hay procesos publicados.</p>
      )}

      {processes.length > 0 && (
        <>
          {overviewQuery.isPending && !overviewQuery.data && <DashboardOverviewLoadingSkeleton />}
          {overviewQuery.isFetching && overviewQuery.data && (
            <div role="status" className={styles.refreshingState} data-testid="overview-refreshing">
              <span className={styles.spinner} aria-hidden="true" />
              <span>Actualizando indicadores…</span>
              <span className={styles.progressBar} aria-hidden="true" />
            </div>
          )}
          {overviewQuery.isError && (
            <p role="alert" className={styles.state}>No pudimos cargar el resumen analítico.</p>
          )}
          {overviewQuery.isSuccess && primary && (
            <div aria-busy={overviewQuery.isFetching}>
              <DashboardContent
                primary={primary}
                comparisons={selectedComparisons}
                previous={previous}

                filterControls={<DashboardFilterControls
                  areas={areasQuery.data ?? []}
                  faculties={facultiesQuery.data ?? []}
                  modalities={modalitiesQuery.data ?? []}
                  filters={filters}
                  onChange={updateFilters}
                  onReset={() => {
                    const nextView = emptyDashboardView;
                    setSavedView(nextView);
                    saveDashboardView(nextView);
                    const next = new URLSearchParams(primaryId ? { process: primaryId } : {});
                    next.delete("compare");
                    next.delete("academic_area");
                    next.delete("faculty");
                    next.delete("modality");
                    setParams(next);
                  }}
                />}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
