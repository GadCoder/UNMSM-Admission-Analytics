import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import * as api from "../api/analytics";
import { HistoryTable } from "../components/MajorDetailHistory";
import { MajorDetailControls } from "../components/MajorDetailControls";
import { Metric, ProcessMetrics } from "../components/MajorDetailMetrics";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "./DashboardPage.module.css";

export function MajorDetailPage() {
  const { majorId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const processesQuery = api.usePublishedProcesses();
  const processes = processesQuery.data ?? [];
  const latest = processes[0];
  const primary = params.get("process") ?? (latest ? String(latest.id) : "");
  const comparisons = (params.get("compare")?.split(",").filter((id) => id && id !== primary) ?? []).slice(0, 3);
  const query = api.useMajorDetail(majorId, primary, comparisons);
  const detail = query.data;
  const selected = detail?.selected_processes ?? [];
  const current = selected[0];

  const updateSelection = (nextPrimary: string, nextComparisons: string[]) => {
    const next = new URLSearchParams(params);
    next.set("process", nextPrimary);
    const safeComparisons = nextComparisons.filter((id) => id !== nextPrimary).slice(0, 3);
    if (safeComparisons.length) next.set("compare", safeComparisons.join(","));
    else next.delete("compare");
    setParams(next);
  };

  useEffect(() => {
    if (latest && !params.get("process")) {
      const next = new URLSearchParams(params);
      next.set("process", String(latest.id));
      setParams(next, { replace: true });
    }
  }, [latest, params, setParams]);

  if (query.isPending) return <section className={styles.page}><p role="status" className={styles.state}>Cargando detalle de la carrera…</p></section>;
  if (query.isError || !detail || !current) return <section className={styles.page}><p role="alert" className={styles.state}>No pudimos cargar el detalle de esta carrera.</p><Link className={styles.detailBack} to="/">Volver al dashboard</Link></section>;

  const rate = current.total_results ? (current.admitted_count / current.total_results) * 100 : 0;
  const timeline = [...selected, ...(detail.history ?? [])].sort((left, right) => {
    if (left.process.year !== right.process.year) return left.process.year - right.process.year;
    return left.process.sequence.localeCompare(right.process.sequence);
  });
  return <section className={styles.page} aria-label="Detalle de la carrera" aria-busy={query.isFetching}>
    {query.isFetching && <div role="status" className={styles.refreshingState}><span className={styles.spinner} aria-hidden="true" />Actualizando detalle…</div>}
    <Link className={styles.detailBack} to={`/?process=${current.process.id}`}>← Volver al desempeño por carrera</Link>
    <header className={styles.detailHero}>
      <div>
        <p className={styles.eyebrow}>Detalle de carrera</p>
        <h1>{detail.major.name}</h1>
        <p className={styles.intro}>{detail.major.faculty} · {detail.major.academic_area}</p>
      </div>
      <span className={styles.detailProcessBadge}>{formatProcessLabel(current.process)}</span>
    </header>

    <div className={styles.kpis}>
      <Metric label="Postulantes" value={formatNumber(current.total_results)} />
      <Metric label="Postulantes ausentes" value={formatNumber(current.absent_count)} />
      <Metric label="Ingresantes" value={formatNumber(current.admitted_count)} />
      <Metric label="Porcentaje de ingresantes" value={`${formatNumber(rate, 1)}%`} />
      <Metric label="Puntaje máximo" value={formatNumber(current.highest_score, 2)} />
      <Metric label="Puntaje promedio" value={formatNumber(current.average_score, 2)} />
    </div>
    <MajorDetailControls
      processes={processes}
      primary={primary}
      comparisons={comparisons}
      onPrimaryChange={(nextPrimary) => updateSelection(nextPrimary, comparisons)}
      onComparisonChange={(processId, checked) => updateSelection(primary, checked ? [...comparisons, processId] : comparisons.filter((id) => id !== processId))}
    />

    {selected.length > 1 && <section className={styles.card} aria-labelledby="comparison-heading"><h2 id="comparison-heading">Comparación de procesos</h2><p className={styles.chartDescription}>Diferencias respecto al proceso principal: {formatProcessLabel(current.process)}.</p><div className={styles.detailProcessList}>{selected.slice(1).map((item) => <ProcessMetrics key={item.process.id} item={item} baseline={current} />)}</div></section>}
    <section className={styles.card} aria-labelledby="history-heading"><h2 id="history-heading">Evolución de la carrera</h2><p className={styles.chartDescription}>Indicadores de la carrera en los procesos de admisión publicados.</p><HistoryTable items={timeline} /></section>
  </section>;
}
