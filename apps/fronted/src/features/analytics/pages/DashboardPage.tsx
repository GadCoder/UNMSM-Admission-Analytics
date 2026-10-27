import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { SelectField } from "../components/SelectField";
import { formatAdmissionModalityLabel, modalityNameFromParam, modalityUrlValue, resolveAdmissionModality } from "../utils/admissionModality";
import * as api from "../api/analytics";
import { ActiveFilterChips } from "../components/ActiveFilterChips";
import controlsStyles from "../components/ResultsControls.module.css";
import { DashboardContent } from "../components/DashboardContent";
import { DashboardControls, DashboardFilterControls } from "../components/DashboardControls";
import { DashboardLoadingSkeleton, DashboardOverviewLoadingSkeleton } from "../components/LoadingSkeletons";
import { emptyDashboardView, readDashboardView, saveDashboardView, type DashboardView } from "../utils/dashboardSessionState";
import styles from "./DashboardPage.module.css";

const FILTER_PARAM_NAMES = ["academic_area", "faculty", "modality"] as const;

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const [savedView, setSavedView] = useState<DashboardView>(readDashboardView);
  const migratedParamsRef = useRef<string | null>(null);
  const initializedProcessRef = useRef(false);
  const processesQuery = api.usePublishedProcesses();
  const processes = processesQuery.data ?? [];
  const areasQuery = api.useAcademicAreas();
  const facultiesQuery = api.useFaculties();
  const modalitiesQuery = api.useModalities();
  const modalityParam = params.get("modality");
  const modalityName = modalityParam ? modalityNameFromParam(modalityParam, modalitiesQuery.data) : undefined;
  const filters = {
    academicArea: params.get("academic_area") ?? savedView.filters.academicArea,
    faculty: params.get("faculty") ?? savedView.filters.faculty,
    modality: resolveAdmissionModality(modalityName ?? (modalityParam && /^\d+$/.test(modalityParam) && !modalitiesQuery.data ? savedView.filters.modality : modalityParam) ?? savedView.filters.modality),
  };
  const latest = processes[0];
  const primaryId = params.get("process") ?? (latest ? String(latest.id) : "");
  const comparisonParam = params.get("compare");
  const primaryIndex = processes.findIndex((process) => String(process.id) === primaryId);
  const previousProcess = primaryIndex >= 0 ? processes[primaryIndex + 1] : undefined;
  const previousId = previousProcess ? String(previousProcess.id) : "";
  const overviewComparisons = previousId ? [previousId] : [];

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
    if (modalityParam && /^\d+$/.test(modalityParam) && !modalitiesQuery.data && !modalitiesQuery.isError) return;
    const paramsKey = params.toString();
    if (migratedParamsRef.current === paramsKey) return;
    migratedParamsRef.current = paramsKey;

    const migratedView = {
      filters: {
        academicArea: params.get("academic_area") ?? savedView.filters.academicArea,
        faculty: params.get("faculty") ?? savedView.filters.faculty,
        modality: resolveAdmissionModality(modalityName ?? (modalityParam && /^\d+$/.test(modalityParam) ? undefined : modalityParam) ?? savedView.filters.modality),
      },
    };
    setSavedView(migratedView);
    saveDashboardView(migratedView);
    const next = new URLSearchParams(params);
    if (primaryId) next.set("process", primaryId);
    next.delete("compare");
    FILTER_PARAM_NAMES.forEach((name) => next.delete(name));
    setParams(next, { replace: true });
  }, [comparisonParam, modalityName, modalityParam, modalitiesQuery.data, modalitiesQuery.isError, params, primaryId, savedView, setParams]);

  const overviewQuery = api.useAnalyticsOverview(primaryId, overviewComparisons, filters);
  const historyQuery = api.useProcessHistory(filters);
  const selected = overviewQuery.data?.processes ?? [];
  const primary = selected.find((item) => String(item.process.id) === primaryId);
  const previous = selected.find((item) => String(item.process.id) === previousId);
  const updateSelection = (process: string) => {
    const next = new URLSearchParams(process ? { process } : {});
    setParams(next);
  };

  const updateFilters = useCallback((nextFilters: { academicArea: string; faculty: string; modality: string }) => {
    const next = new URLSearchParams(primaryId ? { process: primaryId } : {});
    const nextView = { filters: { ...nextFilters, modality: resolveAdmissionModality(nextFilters.modality) } };
    setSavedView(nextView);
    saveDashboardView(nextView);
    setParams(next);
  }, [primaryId, setParams]);

  const returnParams = new URLSearchParams({ process: primaryId });
  if (filters.academicArea) returnParams.set("academic_area", filters.academicArea);
  if (filters.faculty) returnParams.set("faculty", filters.faculty);
  const modalityId = modalityUrlValue(filters.modality, modalitiesQuery.data);
  if (modalityId) returnParams.set("modality", modalityId);
  const returnTo = `/?${returnParams.toString()}`;

  const resetFilters = () => {
    const nextView = { filters: emptyDashboardView.filters };
    setSavedView(nextView);
    saveDashboardView(nextView);
    const next = new URLSearchParams(primaryId ? { process: primaryId } : {});
    next.delete("compare");
    next.delete("academic_area");
    next.delete("faculty");
    next.delete("modality");
    setParams(next);
  };

  return (
    <section className={styles.page}>
      {processes.length > 0 && (
        <section className={`${controlsStyles.toolbar} ${styles.processToolbar}`} aria-label="Controles del análisis">
          <DashboardControls
            processes={processes}
            primaryId={primaryId}
            onChange={updateSelection}
          />
          <div className={styles.modalityControl}>
            <SelectField label="Modalidad" aria-label="Modalidad" value={filters.modality} title={filters.modality}
              aria-description={filters.modality} onChange={(event) => updateFilters({ ...filters, modality: event.target.value })}>
              {!(modalitiesQuery.data ?? []).some((item) => item.name === filters.modality)
                && <option value={filters.modality}>{formatAdmissionModalityLabel(filters.modality)}</option>}
              {(modalitiesQuery.data ?? []).map((item) => <option key={item.id} value={item.name} title={item.name}>{formatAdmissionModalityLabel(item.name)}</option>)}
            </SelectField>
          </div>
          <div className={`${controlsStyles.filterAction} ${styles.filterControl}`}>
            <DashboardFilterControls
              areas={areasQuery.data ?? []}
              faculties={facultiesQuery.data ?? []}
              modalities={modalitiesQuery.data ?? []}
              filters={filters}
              onChange={updateFilters}
              onReset={resetFilters}
            />
          </div>
          <ActiveFilterChips
            filters={filters}
            areas={areasQuery.data ?? []}
            faculties={facultiesQuery.data ?? []}
            onChange={updateFilters}
          />
        </section>
      )}

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
                navigation={{ modalityId, processReturnTo: returnTo }}
                selectedProcessId={Number(primaryId)}
                previous={previous}
                historyItems={historyQuery.data?.processes ?? []}
                historyStatus={historyQuery.isFetching && !historyQuery.data ? "loading" : historyQuery.isError ? "error" : "ready"}
                onSelectProcess={(processId) => updateSelection(String(processId))}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
