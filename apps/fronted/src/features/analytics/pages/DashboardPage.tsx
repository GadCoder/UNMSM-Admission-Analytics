import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { useAnalyticsOverview, usePublishedProcesses } from "../api/analytics";
import { DashboardContent } from "../components/DashboardContent";
import { DashboardControls } from "../components/DashboardControls";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const processesQuery = usePublishedProcesses();
  const processes = processesQuery.data ?? [];
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

  const overviewQuery = useAnalyticsOverview(primaryId, comparisons);
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

  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>Admisión UNMSM · Analítica comparativa</p>
      <h1>Resultados que se entienden.</h1>
      <p className={styles.intro}>
        Explora el desempeño de cada proceso de admisión y compara hasta tres convocatorias en un solo lugar.
      </p>

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
          {overviewQuery.isPending && (
            <p role="status" className={styles.state}>Cargando indicadores…</p>
          )}
          {overviewQuery.isError && (
            <p role="alert" className={styles.state}>No pudimos cargar el resumen analítico.</p>
          )}
          {overviewQuery.isSuccess && primary && (
            <DashboardContent
              primary={primary}
              comparisons={selected.slice(1)}
              processById={processById}
            />
          )}
        </>
      )}
    </section>
  );
}
