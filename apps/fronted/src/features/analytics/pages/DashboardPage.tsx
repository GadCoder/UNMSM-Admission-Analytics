import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import * as api from "../api/analytics";
import { DashboardContent } from "../components/DashboardContent";
import { DashboardControls, DashboardFilterControls } from "../components/DashboardControls";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const processesQuery = api.usePublishedProcesses();
  const processes = processesQuery.data ?? [];
  const areasQuery = api.useAcademicAreas();
  const facultiesQuery = api.useFaculties();
  const modalitiesQuery = api.useModalities();
  const filters = {
    academicArea: params.get("academic_area") ?? "",
    faculty: params.get("faculty") ?? "",
    modality: params.get("modality") ?? "",
  };
  const latest = processes[0];
  const primaryId = params.get("process") ?? (latest ? String(latest.id) : "");
  const comparisons = (params.get("compare")?.split(",").filter(Boolean) ?? [])
    .filter((id) => id !== primaryId)
    .slice(0, 3);

  useEffect(() => {
    if (latest && !params.get("process")) {
      const next = new URLSearchParams(params);
      next.set("process", String(latest.id));
      setParams(next, { replace: true });
    }
  }, [latest, params, setParams]);

  const overviewQuery = api.useAnalyticsOverview(primaryId, comparisons, filters);
  const selected = overviewQuery.data?.processes ?? [];
  const primary = selected[0];
  const processById = new Map(processes.map((process) => [String(process.id), process]));

  const updateSelection = (process: string, compare: string[]) => {
    const next = new URLSearchParams(params);
    if (process) next.set("process", process);
    else next.delete("process");

    const safeCompare = compare.filter((id) => id !== process).slice(0, 3);
    if (safeCompare.length) next.set("compare", safeCompare.join(","));
    else next.delete("compare");
    setParams(next);
  };

  const updateFilters = useCallback((nextFilters: { academicArea: string; faculty: string; modality: string }) => {
    const next = new URLSearchParams(params);
    const filterParams = { academicArea: "academic_area", faculty: "faculty", modality: "modality" } as const;
    (Object.keys(filterParams) as Array<keyof typeof filterParams>).forEach((key) => {
      const value = nextFilters[key];
      if (value) next.set(filterParams[key], value); else next.delete(filterParams[key]);
    });
    setParams(next);
  }, [params, setParams]);

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Admisión UNMSM · Analítica comparativa</p>
          <h1>La admisión que se entiende.</h1>
          <p className={styles.intro}>
            Explora el desempeño de cada proceso de admisión y compara hasta tres convocatorias en un solo lugar.
          </p>
        </div>
        {latest && <span className={styles.processBadge}>Proceso principal · {latest.year}-{latest.sequence}</span>}
      </div>

      {processesQuery.isPending && (
        <p role="status" className={styles.state}>Cargando procesos…</p>
      )}
      {processesQuery.isError && (
        <p role="alert" className={styles.state}>No pudimos cargar los procesos. Intenta nuevamente.</p>
      )}
      {!processesQuery.isPending && !processesQuery.isError && processes.length === 0 && (
        <p className={styles.state}>Aún no hay procesos publicados.</p>
      )}

      {processes.length > 0 && (
        <>
          <DashboardControls
            processes={processes}
            primaryId={primaryId}
            comparisons={comparisons}
            onChange={updateSelection}
          />
          {overviewQuery.isPending && !overviewQuery.data && (
            <p role="status" className={styles.state}>Cargando indicadores…</p>
          )}
          {overviewQuery.isFetching && overviewQuery.data && (
            <p role="status" className={styles.refreshingState}>Actualizando indicadores…</p>
          )}
          {overviewQuery.isError && (
            <p role="alert" className={styles.state}>No pudimos cargar el resumen analítico.</p>
          )}
          {overviewQuery.isSuccess && primary && (
            <DashboardContent
              primary={primary}
              comparisons={selected.slice(1)}
              processById={processById}
              filterControls={<DashboardFilterControls
                areas={areasQuery.data ?? []}
                faculties={facultiesQuery.data ?? []}
                modalities={modalitiesQuery.data ?? []}
                filters={filters}
                onChange={updateFilters}
                onReset={() => {
                  const next = new URLSearchParams(params);
                  next.delete("compare");
                  next.delete("academic_area");
                  next.delete("faculty");
                  next.delete("modality");
                  setParams(next);
                }}
              />}
            />
          )}
        </>
      )}
    </section>
  );
}
