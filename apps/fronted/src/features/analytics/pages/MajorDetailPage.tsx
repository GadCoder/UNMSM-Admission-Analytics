import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import type { MajorDetailProcess, ProcessOverview } from "../api/analytics.types";
import * as api from "../api/analytics";
import { HistoryTable } from "../components/MajorDetailHistory";
import { MajorDetailLoadingSkeleton } from "../components/LoadingSkeletons";
import { KpiGrid } from "../components/KpiGrid";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "./DashboardPage.module.css";

const ROMAN_SEQUENCE_ORDER: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

function sequenceOrder(sequence: string) {
  const normalized = sequence.trim().toUpperCase();
  const separator = normalized.lastIndexOf("-");
  const value = separator >= 0 ? normalized.slice(separator + 1) : normalized;
  const numeric = Number(value);
  return ROMAN_SEQUENCE_ORDER[value] ?? (Number.isFinite(numeric) ? numeric : 0);
}

function compareProcessPeriod(left: MajorDetailProcess, right: MajorDetailProcess) {
  return left.process.year - right.process.year
    || sequenceOrder(left.process.sequence) - sequenceOrder(right.process.sequence)
    || left.process.id - right.process.id;
}

function asProcessOverview(item: MajorDetailProcess): ProcessOverview {
  return { ...item, majors: [] };
}

export function MajorDetailPage() {
  const { majorId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const processesQuery = api.usePublishedProcesses();
  const processes = processesQuery.data ?? [];
  const latest = processes[0];
  const primary = params.get("process") ?? (latest ? String(latest.id) : "");
  const comparisonParam = params.get("compare");

  useEffect(() => {
    if (comparisonParam === null) return;
    const next = new URLSearchParams(params);
    next.delete("compare");
    setParams(next, { replace: true });
  }, [comparisonParam, params, setParams]);

  const query = api.useMajorDetail(majorId, primary, []);
  const detail = query.data;
  const selected = detail?.selected_processes ?? [];
  const current = selected[0];

  const updateSelection = (nextPrimary: string) => {
    const next = new URLSearchParams(params);
    next.set("process", nextPrimary);
    next.delete("compare");
    setParams(next);
  };

  useEffect(() => {
    if (latest && !params.get("process")) {
      const next = new URLSearchParams(params);
      next.set("process", String(latest.id));
      setParams(next, { replace: true });
    }
  }, [latest, params, setParams]);

  if (query.isPending) return <section className={styles.page}><MajorDetailLoadingSkeleton /></section>;
  if (query.isError || !detail || !current) return <section className={styles.page}><p role="alert" className={styles.state}>No pudimos cargar el detalle de esta carrera.</p><Link className={styles.detailBack} to="/">Volver a la vista de proceso</Link></section>;

  const byProcessId = new Map<number, MajorDetailProcess>();
  for (const item of [...(detail.history ?? []), ...selected]) byProcessId.set(item.process.id, item);
  const timeline = [...byProcessId.values()].sort(compareProcessPeriod);
  const previous = timeline.filter((item) => compareProcessPeriod(item, current) < 0).at(-1);
  const currentOverview = asProcessOverview(current);


  return <section className={styles.page} aria-label="Detalle de la carrera" aria-busy={query.isFetching}>
    {query.isFetching && <div role="status" className={styles.refreshingState}><span className={styles.spinner} aria-hidden="true" />Actualizando detalle…</div>}
    <Link className={styles.detailBack} to={`/?process=${current.process.id}`}>← Volver a la vista de proceso</Link>
    <header className={styles.hero}>
      <div>
        <h1>{detail.major.name}</h1>
        <p className={styles.intro}>{detail.major.faculty} · {detail.major.academic_area}</p>
      </div>
      <section className={`${styles.processContext} ${styles.detailProcessContext}`} aria-label="Contexto del análisis">
        <div className={styles.primaryProcessControl}>
          <label htmlFor="primary-process">Proceso analizado</label>
          <select id="primary-process" value={primary} onChange={(event) => updateSelection(event.target.value)}>
            {processes.map((process) => <option key={process.id} value={process.id}>{formatProcessLabel(process)}</option>)}
          </select>
        </div>
      </section>
    </header>

    <KpiGrid overview={currentOverview} previous={previous ? asProcessOverview(previous) : undefined} />

    <section className={`${styles.card} ${styles.comparisonCard}`} aria-labelledby="history-heading">
      <header className={styles.comparisonCardHeader}>
        <h2 id="history-heading" className={styles.comparisonSectionTitle}>Resultados históricos</h2>
      </header>
      <HistoryTable items={timeline} />
    </section>
  </section>;
}
