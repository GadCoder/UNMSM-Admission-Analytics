import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { useAnalyticsOverview, usePublishedProcesses } from "../../shared/api/analytics";
import type { AdmissionProcess, ProcessOverview } from "../../shared/api/analytics";
import styles from "./DashboardPage.module.css";

const formatNumber = (value: number | string | null, digits = 0) => value === null ? "—" : Number(value).toLocaleString("es-PE", { maximumFractionDigits: digits });

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const processesQuery = usePublishedProcesses();
  const processes = processesQuery.data ?? [];
  const latest = processes[0];
  const primaryId = params.get("process") ?? (latest ? String(latest.id) : "");
  const comparisons = (params.get("compare")?.split(",").filter(Boolean) ?? []).filter((id) => id !== primaryId).slice(0, 3);

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
  const comparisonData = selected.slice(1);
  const processById = new Map(processes.map((process) => [String(process.id), process]));

  const updateSelection = (process: string, compare: string[]) => {
    const next = new URLSearchParams(params);
    if (process) next.set("process", process); else next.delete("process");
    const safeCompare = compare.filter((id) => id !== process).slice(0, 3);
    if (safeCompare.length) next.set("compare", safeCompare.join(",")); else next.delete("compare");
    setParams(next);
  };

  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>Admisión UNMSM · Analítica comparativa</p>
      <h1>Resultados que se entienden.</h1>
      <p className={styles.intro}>Explora el desempeño de cada proceso de admisión y compara hasta tres convocatorias en un solo lugar.</p>

      {processesQuery.isPending && <p role="status" className={styles.state}>Cargando procesos…</p>}
      {processesQuery.isError && <p role="alert" className={styles.state}>No pudimos cargar los procesos. Intenta nuevamente.</p>}
      {!processesQuery.isPending && !processesQuery.isError && processes.length === 0 && <p className={styles.state}>Aún no hay procesos publicados.</p>}
      {processes.length > 0 && (
        <>
          <div className={styles.controls} aria-label="Selección de procesos">
            <label htmlFor="primary-process">Proceso principal
              <select id="primary-process" value={primaryId} onChange={(event) => updateSelection(event.target.value, comparisons)}>
                {processes.map((process) => <option key={process.id} value={process.id}>{process.name}</option>)}
              </select>
            </label>
            <label htmlFor="comparison-processes">Comparar con
              <select id="comparison-processes" multiple value={comparisons} onChange={(event) => updateSelection(primaryId, Array.from(event.target.selectedOptions, (option) => option.value))}>
                {processes.filter((process) => String(process.id) !== primaryId).map((process) => <option key={process.id} value={process.id}>{process.name}</option>)}
              </select>
              <small>Selecciona hasta 3 procesos.</small>
            </label>
          </div>
          {overviewQuery.isPending && <p role="status" className={styles.state}>Cargando indicadores…</p>}
          {overviewQuery.isError && <p role="alert" className={styles.state}>No pudimos cargar el resumen analítico.</p>}
          {overviewQuery.isSuccess && primary && <DashboardContent primary={primary} comparisons={comparisonData} processById={processById} />}
        </>
      )}
    </section>
  );
}

function DashboardContent({ primary, comparisons, processById }: { primary: ProcessOverview; comparisons: ProcessOverview[]; processById: Map<string, AdmissionProcess> }) {
  const admissionRate = primary.total_results ? (primary.admitted_count / primary.total_results) * 100 : 0;
  return <>
    <div className={styles.heading}><div><span className={styles.cardLabel}>Proceso principal</span><h2>{primary.process.name}</h2></div><span>{primary.process.year} · etapa {primary.process.sequence}</span></div>
    <div className={styles.kpis}>
      <Kpi label="Total de resultados" value={formatNumber(primary.total_results)} />
      <Kpi label="Admitidos" value={formatNumber(primary.admitted_count)} />
      <Kpi label="Ausentes" value={formatNumber(primary.absent_count)} />
      <Kpi label="Tasa de admisión" value={`${formatNumber(admissionRate, 1)}%`} />
      <Kpi label="Promedio" value={formatNumber(primary.average_score, 2)} />
      <Kpi label="Puntaje más alto" value={formatNumber(primary.highest_score, 2)} />
    </div>
    {comparisons.length > 0 && <aside className={styles.comparison} aria-label="Resumen de comparación"><strong>Comparación</strong>{comparisons.map((item) => <span key={item.process.id}>{processById.get(String(item.process.id))?.name ?? item.process.name}: {formatNumber(item.total_results)} resultados · {formatNumber(item.average_score, 2)} promedio</span>)}</aside>}
    <div className={styles.card}><h2>Desempeño por carrera</h2><div className={styles.tableWrap}><table><caption className={styles.visuallyHidden}>Indicadores por carrera para {primary.process.name}</caption><thead><tr><th scope="col">Código</th><th scope="col">Carrera</th><th scope="col">Resultados</th><th scope="col">Admitidos</th><th scope="col">Ausentes</th><th scope="col">Promedio</th></tr></thead><tbody>{primary.majors.map((major) => <tr key={major.major_id}><th scope="row">{major.major_code}</th><td>{major.major_name}</td><td>{formatNumber(major.total_results)}</td><td>{formatNumber(major.admitted_count)}</td><td>{formatNumber(major.absent_count)}</td><td>{formatNumber(major.average_score, 2)}</td></tr>)}</tbody></table></div></div>
  </>;
}
function Kpi({ label, value }: { label: string; value: string }) { return <article className={styles.kpi}><span>{label}</span><strong>{value}</strong></article>; }
