import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import * as api from "../api/analytics";
import type { AdmissionProcess, MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "./DashboardPage.module.css";

function Metric({ label, value }: { label: string; value: string }) {
  return <article className={styles.kpi}><span>{label}</span><strong>{value}</strong></article>;
}

function ProcessMetrics({ item }: { item: MajorDetailProcess }) {
  const rate = item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
  return <div className={styles.detailProcessMetrics}>
    <strong>{formatProcessLabel(item.process)}</strong>
    <span>{formatNumber(item.total_results)} postulantes</span>
    <span>{formatNumber(item.admitted_count)} ingresantes</span>
    <span>{formatNumber(rate, 1)}% de ingreso</span>
    <span>{formatNumber(item.average_score, 2)} promedio</span>
  </div>;
}

function HistoryTable({ items }: { items: MajorDetailProcess[] }) {
  return <div className={styles.tableWrap}>
    <table aria-label="Historial de resultados por proceso">
      <thead><tr><th scope="col">Proceso</th><th scope="col">Postulantes</th><th scope="col">Ingresantes</th><th scope="col">Tasa de ingreso</th><th scope="col">Puntaje promedio</th></tr></thead>
      <tbody>{items.map((item) => {
        const rate = item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
        return <tr key={item.process.id}>
          <th scope="row">{formatProcessLabel(item.process)}</th>
          <td>{formatNumber(item.total_results)}</td>
          <td>{formatNumber(item.admitted_count)}</td>
          <td>{formatNumber(rate, 1)}%</td>
          <td>{formatNumber(item.average_score, 2)}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

function ProcessControls({
  processes,
  primary,
  comparisons,
  onPrimaryChange,
  onComparisonChange,
}: {
  processes: AdmissionProcess[];
  primary: string;
  comparisons: string[];
  onPrimaryChange: (value: string) => void;
  onComparisonChange: (processId: string, checked: boolean) => void;
}) {
  return <div className={`${styles.controls} ${styles.detailControls}`}>
    <div className={`${styles.control} ${styles.primaryControl}`}>
      <label htmlFor="detail-primary-process">Proceso principal</label>
      <select id="detail-primary-process" value={primary} onChange={(event) => onPrimaryChange(event.target.value)}>
        {processes.map((process) => <option key={process.id} value={process.id}>{formatProcessLabel(process)}</option>)}
      </select>
    </div>
    <details className={styles.comparisonDisclosure} open={comparisons.length > 0}>
      <summary className={styles.comparisonButton}>Comparar procesos <span aria-hidden="true">⌄</span></summary>
      <div className={styles.comparisonMenu}>
        <strong>Procesos para comparar</strong>
        <small>Selecciona hasta tres procesos adicionales.</small>
        {processes.map((process) => {
          const processId = String(process.id);
          return <label className={styles.comparisonOption} key={process.id}>
            <input
              type="checkbox"
              checked={comparisons.includes(processId)}
              disabled={processId === primary}
              onChange={(event) => onComparisonChange(processId, event.target.checked)}
            />
            <span>{formatProcessLabel(process)}</span>
          </label>;
        })}
      </div>
    </details>
  </div>;
}

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
    <ProcessControls
      processes={processes}
      primary={primary}
      comparisons={comparisons}
      onPrimaryChange={(nextPrimary) => updateSelection(nextPrimary, comparisons)}
      onComparisonChange={(processId, checked) => updateSelection(primary, checked ? [...comparisons, processId] : comparisons.filter((id) => id !== processId))}
    />
    <header className={styles.detailHero}>
      <div>
        <p className={styles.eyebrow}>Detalle de carrera · {detail.major.code}</p>
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

    {selected.length > 1 && <section className={styles.card} aria-labelledby="comparison-heading"><h2 id="comparison-heading">Comparación de procesos</h2><div className={styles.detailProcessList}>{selected.map((item) => <ProcessMetrics key={item.process.id} item={item} />)}</div></section>}
    <section className={styles.card} aria-labelledby="history-heading"><h2 id="history-heading">Evolución de la carrera</h2><p className={styles.chartDescription}>Indicadores de la carrera en los procesos de admisión publicados.</p><HistoryTable items={timeline} /></section>
  </section>;
}
